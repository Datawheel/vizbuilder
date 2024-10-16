import type {ChartLimits} from "../constants";
import type {D3plusConfig} from "../d3plus";
import {
  DimensionType,
  type TesseractDimension,
  type TesseractHierarchy,
  type TesseractLevel,
  type TesseractMeasure,
} from "../schema";
import {filterMap, getLast} from "../toolbox/array";
import type {Datagroup, LevelCaption} from "../toolbox/datagroup";
import {shortHash} from "../toolbox/math";
import {buildSeries, buildTimeSeries} from "./common";

export interface ChoroplethMap {
  key: string;
  type: "choropleth";
  datagroup: Datagroup;
  values: {
    measure: TesseractMeasure;
    minValue: number;
    maxValue: number;
  };
  series: {
    name: string;
    dimension: TesseractDimension;
    hierarchy: TesseractHierarchy;
    level: TesseractLevel;
    captions: {[K: string]: LevelCaption};
    members: string[] | number[] | boolean[];
  }[];
  timeline?: {
    name: string;
    dimension: TesseractDimension;
    hierarchy: TesseractHierarchy;
    level: TesseractLevel;
    members: string[] | number[] | boolean[];
  };
  extraConfig?: Partial<D3plusConfig>;
}

export function examineChoroplethMapConfigs(
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

  const timeline = buildTimeSeries(timeAxis);

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

    const nonGeoAxes = categoryAxes.filter(
      axis => axis.dimension.type !== DimensionType.GEO,
    );

    return categoryAxes
      .filter(axis => axis.dimension.type === DimensionType.GEO)
      .flatMap(categoryAxis => {
        const {dimension} = categoryAxis;

        const keyChain = [chartType, dataset.length, measure.name];

        return categoryAxis.levels.flatMap<ChoroplethMap>(axisLevel => {
          const extraConfig = getTopojsonConfig(axisLevel.level);
          if (dimension.type === DimensionType.GEO && !extraConfig?.topojson) return [];

          return {
            key: shortHash(keyChain.join("|")),
            type: chartType,
            datagroup: dg,
            values,
            series: [buildSeries(categoryAxis, axisLevel)],
            timeline,
            extraConfig: getTopojsonConfig(getLast(categoryAxis.levels).level),
          };
        });
      });
  });
}

// .concat(
//   nonGeoAxes.map(axis => {
//     const lastLevel = getLast(axis.levels);
//     return buildSeries(axis, lastLevel);
//   }),
// )
