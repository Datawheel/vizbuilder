import {Cube} from "@datawheel/olap-client";
import {formatAbbreviate} from "d3plus-format";
import maxBy from "lodash/maxBy";
import {buildMemberMap} from "./array";
import {findMeasuresInCube} from "./find";
import {isGeographicLevel, isMatchingLevel, isTimeLevel} from "./validation";

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

  const cuts = new Map();
  const drilldowns = [];
  for (const level of cube.levelIterator) {
    for (const item of params.drilldowns) {
      if (isMatchingLevel(item, level)) {
        drilldowns.push(level);
        break;
      }
    }
    for (const item of params.cuts) {
      if (isMatchingLevel(item, level)) {
        cuts.set(level.caption, item.members);
        break;
      }
    }
  }

  const timeDrilldown = drilldowns.find(isTimeLevel);

  const timeDrilldownName = timeDrilldown?.caption;
  const maxPeriod = timeDrilldownName
    ? maxBy(dataset, item => item[timeDrilldownName])
    : undefined;

  const geoDrilldown = drilldowns.find(isGeographicLevel);

  const topojsonConfig = geoDrilldown ? getTopojsonConfig(geoDrilldown) : undefined;

  const stdDrilldowns = drilldowns.filter(lvl => !isTimeLevel(lvl));

  const drilldownNames = drilldowns.map(lvl => lvl.caption);
  const {members, membersCount} = buildMemberMap(dataset, drilldownNames);

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
