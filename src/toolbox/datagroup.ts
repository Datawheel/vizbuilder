import {formatAbbreviate} from "d3plus-format";
import maxBy from "lodash/maxBy";
import {DimensionType, type TesseractCube, type TesseractLevel} from "../schema";
import type {
  D3plusConfig,
  FilterSet,
  MeasureSet,
  QueryParams,
  QueryResult,
} from "../structs";
import {buildMemberMap} from "./array";
import {findMeasuresInCube} from "./find";
import {yieldAllMeasures, yieldDimensionHierarchyLevels} from "./tesseract";

export interface Datagroup {
  cube: TesseractCube;
  cuts: Map<string, string[]>;
  cutLevels: Map<string, TesseractLevel>;
  datacap: number;
  dataset: Record<string, unknown>[];
  drilldowns: TesseractLevel[];
  filters: FilterSet[];
  geoDrilldown: TesseractLevel | undefined;
  locale: string;
  maxPeriod: number | undefined;
  measureSets: MeasureSet[];
  members: Record<string, number[]> | Record<string, string[]>;
  membersCount: Record<string, number>;
  params: QueryParams;
  stdDrilldowns: TesseractLevel[];
  timeDrilldown: TesseractLevel | undefined;
  topojsonConfig: D3plusConfig | undefined;
}

/** */
export function buildDatagroup(
  qr: QueryResult,
  props: {
    datacap: number;
    getTopojsonConfig: (level: TesseractLevel) => D3plusConfig;
  },
): Datagroup {
  const {cube, dataset, params} = qr;
  const {datacap, getTopojsonConfig} = props;

  const measureMap = Object.fromEntries(
    Array.from(yieldAllMeasures(cube), item => [item.name, item])
  )
  const levelMap = Object.fromEntries(
    Array.from(yieldDimensionHierarchyLevels(cube), item => [item[2].name, item]),
  );

  const measureSets = [];
  for (const item of params.measures) {
    const measureSet = findMeasuresInCube(cube, item);
    measureSet && measureSets.push(measureSet);
  }

  const drilldowns = params.drilldowns.map(dd => levelMap[dd.level][2]);
  const cuts = new Map(
    params.cuts.map(ct => {
      const level = levelMap[ct.level][2];
      return [level.caption, ct.members];
    }),
  );
  const cutLevels = new Map(
    params.cuts.map(ct => {
      const level = levelMap[ct.level][2];
      return [level.caption, level];
    }),
  );

  const timeDrilldown = drilldowns.find(
    dd => levelMap[dd.name][0].type === DimensionType.time,
  );

  const timeDrilldownName = timeDrilldown?.caption;
  const maxPeriod = timeDrilldownName
    ? maxBy(dataset, item => item[timeDrilldownName])?.[timeDrilldownName]
    : undefined;

  const geoDrilldown = drilldowns.find(
    dd => levelMap[dd.name][0].type === DimensionType.geo,
  );

  const topojsonConfig = geoDrilldown ? getTopojsonConfig(geoDrilldown) : undefined;

  const stdDrilldowns = drilldowns.filter(
    dd => levelMap[dd.name][0].type === DimensionType.standard,
  );

  const drilldownNames = drilldowns.map(lvl => lvl.caption);
  const {members, membersCount} = buildMemberMap(dataset, drilldownNames);

  const filters = params.filters.map(item => ({
    ...item,
    formatter: item.formatter || formatAbbreviate,
    measure: measureMap[item.measure],
  }));

  return {
    cube,
    datacap,
    dataset,
    drilldowns,
    geoDrilldown,
    timeDrilldown,
    stdDrilldowns,
    measureSets,
    filters,
    cuts,
    cutLevels,
    locale: params.locale,
    maxPeriod,
    params,
    membersCount,
    members,
    topojsonConfig,
  };
}
