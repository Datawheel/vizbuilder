import {Cube} from "@datawheel/olap-client";
import maxBy from "lodash/maxBy";
import {formatAbbreviate} from "d3plus-format";
import {buildMemberMap} from "./array";
import {findLevelInCube, findMeasuresInCube} from "./find";
import {isGeographicLevel, isTimeLevel} from "./validation";

/**
 * @param {VizBldr.QueryResult} qr
 * @param {object} props
 * @param {number} props.datacap
 * @param {(level: import("@datawheel/olap-client").Level) => VizBldr.D3plusConfig} props.getTopojsonConfig
 * @returns {VizBldr.Struct.Datagroup}
 */
export function buildDatagroup(qr, props) {
  const {dataset, params} = qr;
  const {datacap, getTopojsonConfig} = props;

  const cube = new Cube(qr.cube);

  const measureSets = [];
  for (const item of params.measures) {
    const measureSet = findMeasuresInCube(cube, item);
    measureSet && measureSets.push(measureSet);
  }

  const drilldowns = [];
  for (const item of params.drilldowns) {
    const level = findLevelInCube(cube, item);
    level && drilldowns.push(level);
  }

  const timeDrilldown = drilldowns.find(isTimeLevel);

  const timeDrilldownName = timeDrilldown?.caption;
  const maxPeriod = timeDrilldownName
    ? maxBy(dataset, item => item[timeDrilldownName])
    : undefined;

  const geoDrilldown = drilldowns.find(isGeographicLevel);

  const topojsonConfig = geoDrilldown ? getTopojsonConfig(geoDrilldown) : undefined;

  const stdDrilldowns = drilldowns.filter(lvl => ![geoDrilldown, timeDrilldown].includes(lvl));

  const drilldownNames = drilldowns.map(lvl => lvl.caption);
  const {members, membersCount} = buildMemberMap(dataset, drilldownNames);

  const cuts = new Map();
  for (const item of params.cuts) {
    const level = findLevelInCube(cube, item);
    level && cuts.set(level.caption, item.members);
  }

  const filters = params.filters.map(item => ({
    ...item,
    formatter: item.formatter || formatAbbreviate,
    measure: cube.measuresByName[item.measure]
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
    maxPeriod,
    params,
    membersCount,
    members,
    topojsonConfig
  };
}
