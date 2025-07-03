#!/usr/bin/env node

import {writeFile} from "node:fs";
import {translateFunctionFactory} from "@datawheel/use-translation";

import {buildColumn, generateCharts} from "../dist/index.esm.js";
import {d3plusConfigBuilder} from "../dist/react.esm.js";
import * as formatters from "./formatters.js";
import {translations} from "./translations.js";
import {DimensionType} from "@datawheel/logiclayer-client";

const serverURL = "https://api.datasaudi.datawheel.us/tesseract/";
const locale = "ar";
const chartLimits = {
  BARCHART_MAX_BARS: 20,
  BARCHART_YEAR_MAX_BARS: 20,
  BARCHART_MAX_STACKED_BARS: 10,
  DONUT_SHAPE_MAX: 30,
  LINEPLOT_LINE_POINT_MIN: 2,
  LINEPLOT_LINE_MAX: 20,
  STACKED_SHAPE_MAX: 200,
  STACKED_TIME_MEMBER_MIN: 2,
  TREE_MAP_SHAPE_MAX: 1000,
};

const schemaEndpoint = new URL(`cubes?locale=${locale}`, serverURL);
const dataEndpoint = new URL("data.jsonrecords", serverURL);

async function main() {
  const semaphore = new Semaphore(8);

  const schemaResponse = await fetch(schemaEndpoint);
  /** @type {import("@datawheel/logiclayer-client").TesseractSchemaResponse} */
  const schema = await schemaResponse.json();

  const dataRequests = schema.cubes
    .filter(cube => !cube.annotations.hide_in_ui)
    .sort((a, b) => "".localeCompare.call(a.name, b.name))
    .map(async cube => {
      await semaphore.acquire();

      const levels =
        cube.annotations.suggested_levels?.split(",") ||
        defaultDrilldowns(cube.dimensions);
      const measures = cube.measures.map(item => item.name);

      const search = new URLSearchParams({
        cube: cube.name,
        locale: locale,
        drilldowns: levels.join(","),
        measures: measures.join(","),
      });

      console.log("Fetching", search.toString());
      const response = await fetch(`${dataEndpoint}?${search}`);
      /** @type {import("@datawheel/logiclayer-client").TesseractDataResponse} */
      const result = await response.json();
      if (response.status !== 200 || result.error)
        throw new Error(JSON.stringify({...result, params: search.toString()}));

      const columns = result.columns.map(column => {
        const meta = buildColumn(cube, column, result.columns);
        return [column, meta];
      });
      const charts = generateCharts(
        [{locale, data: result.data, columns: Object.fromEntries(columns)}],
        {chartLimits},
      );
      const params = {
        fullMode: false,
        showConfidenceInt: false,
        getFormatter(key) {
          return formatters[key] || (i => i);
        },
        t: translateFunctionFactory(translations[locale]),
      };

      semaphore.release();

      return charts.map(chart => {
        const config = d3plusConfigBuilder[chart.type](chart, params);
        return [search.toString(), chart.type, config.title(result.data)].join("\t");
      });
    });

  const results = await Promise.all(dataRequests);
  const listOfTitles = [...new Set(results.flat())].sort().join("\n");

  writeFile(`titles_${locale}.tsv`, listOfTitles, "utf-8", (err) => {
    if (err) throw err;
    console.log("The file has been saved!");
  });
}

class Semaphore {
  constructor(limit) {
    this.limit = limit;
    this.available = limit;
    this.queue = [];
  }

  acquire() {
    if (this.available > 0) {
      this.available--;
      return Promise.resolve();
    }
    return new Promise(resolve => {
      this.queue.push(resolve);
    });
  }

  release() {
    const item = this.queue.shift();
    if (item) {
      this.available--;
      item();
    } else {
      this.available++;
    }
  }
}

/** @param {import("@datawheel/logiclayer-client").TesseractDimension[]} dimensions */
function defaultDrilldowns(dimensions) {
  /** @type {[string, `${DimensionType}`, number][]} */
  const levels = [];

  for (const dim of dimensions) {
    if (dim.type === DimensionType.TIME || levels.length < 4) {
      const hie =
        dim.hierarchies.find(hie => hie.name === dim.default_hierarchy) ||
        dim.hierarchies[0];
      const index = dim.type === DimensionType.GEO ? hie.levels.length - 1 : 0;
      const level = hie.levels[index];
      levels.push([level.name, dim.type, level.count || 0]);
    }
  }

  while (levels.reduce((sum, item) => sum + item[2], 0) > 5e6) {
    const index =
      levels.findIndex(item => item[1] === DimensionType.GEO) || levels.length - 1;
    levels.splice(index, 1);
  }

  return levels.map(item => item[0]);
}

main();
