import {
  type TesseractCube,
  type TesseractDataResponse,
  TesseractModuleClient,
} from "@datawheel/logiclayer-client";
import {describe, test} from "vitest";
import {generateCharts} from "../src/charts/generator";
import {buildColumn} from "../src/toolbox/columns";

describe("generateCharts", async () => {
  const locale = "en";
  const url = new URL("https://api.datasaudi.datawheel.us/tesseract/");
  const client = new TesseractModuleClient(url);

  // 1. Fetch the schema at the top level of the describe block.
  const schema = await client.fetchSchema({locale});
  const cubes = schema.cubes.filter(cube => !cube.annotations.hide_in_ui);
  const cubeMap = Object.fromEntries(cubes.map(cube => [cube.name, cube]));
  const requests = cubes.flatMap(intoRequests);

  // 2. Since requests is now populated, test.for will work correctly.
  test.for(requests)(
    "should return a Chart for $cube - $drilldowns",
    {timeout: 60000},
    async (request, {expect, skip, onTestFinished}) => {
      skip(request.drilldowns.length === 0);

      // 3. Fetch data ONLY when this specific test case runs
      let result: TesseractDataResponse = await client
        .fetchData(request, "jsonrecords")
        .then(res => res.json());

      const columns = Object.fromEntries(
        result.columns.map(column => [
          column,
          buildColumn(cubeMap[request.cube], column, result.columns),
        ]),
      );

      let dataset = {columns, data: result.data, locale};
      const charts = generateCharts([dataset]);

      expect(charts.length).toBeGreaterThan(0);

      // 4. Explicitly hint for Garbage Collection if memory is still an issue
      // nulling out large objects helps the engine reclaim memory faster
      onTestFinished(() => {
        dataset = null as any;
        result = null as any;
      });
    },
  );
});

function getName(item: {name: string}) {
  return item.name;
}

function intoRequests(cube: TesseractCube) {
  const hiddenDimensions = (cube.annotations.hidden_dimensions || "").split(",");
  const hiddenMeasures = (cube.annotations.hidden_measures || "").split(",");

  const measures = cube.measures
    .filter(item => !item.annotations.hide_in_ui && !hiddenMeasures.includes(item.name))
    .map(getName);

  const dimensions = cube.dimensions.filter(
    dimension => !hiddenDimensions.includes(dimension.name),
  );

  const levels = Object.fromEntries(
    dimensions.flatMap(dim =>
      dim.hierarchies.flatMap(hie => hie.levels.map(lvl => [lvl.name, lvl] as const)),
    ),
  );

  const drilldownSets = dimensions.reduce(
    (combos, dimension) => {
      const {hierarchies} = dimension;
      return combos.flatMap(dds =>
        hierarchies.map(hie => [...dds, ...hie.levels.map(getName)]),
      );
    },
    [[]] as string[][],
  );

  return drilldownSets.map(drilldowns => {
    const exclude = drilldowns.flatMap(dd => {
      const level = levels[dd];
      const members = level?.annotations?.vb_exclude_members || "";
      return level && members ? (`${level.name}:${members.split(",")}` as const) : [];
    });

    return {cube: cube.name, measures, drilldowns, exclude};
  });
}
