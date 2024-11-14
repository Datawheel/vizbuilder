import type {D3plusConfig} from "../d3plus";
import {DimensionType, type TesseractLevel} from "../schema";
import {getLast} from "../toolbox/array";
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
  const {dataset, timeHierarchy: timeAxis} = dg;
  const {getTopojsonConfig} = params;

  const chartType = "choropleth" as const;

  const categoryAxes = Object.values(dg.nonTimeHierarchies);

  const timeline = buildDeepestSeries(timeAxis);

  const geoAxes = categoryAxes.filter(axis => axis.dimension.type === DimensionType.GEO);

  if (geoAxes.length === 0) return [];

  return dg.measureColumns.flatMap(valueAxis => {
    const {measure, range} = valueAxis;

    if (valueAxis.parentMeasure) return [];

    const values = {
      measure,
      minValue: range[0],
      maxValue: range[1],
    };

    return geoAxes.flatMap(categoryAxis => {
      const {dimension} = categoryAxis;

      const keyChain = [chartType, dataset.length, measure.name];

      return categoryAxis.levels.flatMap<ChoroplethMap>(axisLevel => {
        const d3plusConfig = getTopojsonConfig(axisLevel.level);
        if (dimension.type === DimensionType.GEO && !d3plusConfig?.topojson) return [];

        return {
          key: shortHash(keyChain.join("|")),
          type: chartType,
          datagroup: dg,
          values,
          series: [buildSeries(categoryAxis, axisLevel)],
          timeline,
          extraConfig: {
            d3plus: d3plusConfig,
          },
        };
      });
    });
  });
}
