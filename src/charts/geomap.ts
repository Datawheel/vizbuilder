import {DimensionType, type TesseractLevel} from "@datawheel/logiclayer-client";
import type {D3plusConfig} from "../d3plus";
import {shortHash} from "../toolbox/math";
import {isSummableMeasure} from "../toolbox/validation";
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
  const stdHierarchies = categoryHierarchies.filter(
    catHierarchy => catHierarchy.dimension.type === DimensionType.STANDARD,
  );

  if (geoHierarchies.length === 0) return [];

  return dg.measureColumns.flatMap(valueColumn => {
    const {measure, range} = valueColumn;
    const isSummable = isSummableMeasure(measure);

    if (valueColumn.parentMeasure) return [];

    const values = {
      measure,
      minValue: range[0],
      maxValue: range[1],
    };

    return geoHierarchies.flatMap(geoHierarchy => {
      const keyChain = [chartType, dataset.length, measure.name];

      if (stdHierarchies.length > 0 && !isSummable) {
        if (stdHierarchies.length === 1) {
          const {levels} = stdHierarchies[0];
          const allowedLevel = levels
            .filter(catLevel => catLevel.members.length < 3)
            .at(-1);

          if (allowedLevel) {
            return allowedLevel.members.flatMap(member => {
              const dataset = dg.dataset.filter(row => row[allowedLevel.name] === member);

              return geoHierarchy.levels.flatMap<ChoroplethMap>(geoLevel => {
                const d3plusConfig = getTopojsonConfig(geoLevel.entity);
                // Bail is there's no d3plus config for this level
                if (!d3plusConfig?.topojson) {
                  return [];
                }
                return {
                  key: shortHash(keyChain.concat(allowedLevel.name, member).join("!")),
                  type: chartType,
                  datagroup: {...dg, dataset},
                  values,
                  series: [buildSeries(geoHierarchy, geoLevel)],
                  extraConfig: {
                    isolatedMember: [allowedLevel, member],
                    d3plus: d3plusConfig,
                  },
                };
              });
            });
          }
        }
        return [];
      }

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
