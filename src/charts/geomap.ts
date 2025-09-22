import {DimensionType, type TesseractLevel} from "@datawheel/logiclayer-client";
import type {D3plusConfig} from "../d3plus";
import {shortHash} from "../toolbox/math";
import type {ChartLimits} from "../types";
import {type BaseChart, buildDeepestSeries, buildSeries} from "./common";
import type {Datagroup} from "./datagroup";

export interface ChoroplethMap extends BaseChart {
  type: "choropleth";
}

export function generateChoroplethMapConfigs(
  dg: Datagroup,
  limits: ChartLimits,
  params: {
    getTopojsonConfig: (level: TesseractLevel) => Partial<D3plusConfig> | undefined;
  },
): ChoroplethMap[] {
  const {dataset} = dg;
  const {getTopojsonConfig} = params;

  const chartType = "choropleth" as const;

  const categoryHierarchies = Object.values(dg.nonTimeHierarchies);

  const timeline = buildDeepestSeries(dg.timeHierarchy);

  const geoHierarchies = categoryHierarchies.filter(
    catHierarchy => catHierarchy.dimension.type === DimensionType.GEO,
  );

  if (geoHierarchies.length === 0) return [];

  return dg.measureColumns.flatMap(valueColumn => {
    const {measure, range} = valueColumn;

    if (valueColumn.parentMeasure) return [];

    const values = {
      measure,
      minValue: range[0],
      maxValue: range[1],
    };

    return geoHierarchies.flatMap(geoHierarchy => {
      const keyChain = [chartType, dataset.length, measure.name];

      return geoHierarchy.levels.flatMap<ChoroplethMap>(geoLevel => {
        const d3plusConfig = getTopojsonConfig(geoLevel.entity);

        // Bail is there's no d3plus config for this level
        if (!d3plusConfig?.topojson) {
          return [];
        }

        return {
          key: shortHash(keyChain.join("|")),
          type: chartType,
          datagroup: dg,
          values,
          series: [buildSeries(geoHierarchy, geoLevel)],
          timeline,
          extraConfig: {
            d3plus: d3plusConfig,
          },
        };
      });
    });
  });
}
