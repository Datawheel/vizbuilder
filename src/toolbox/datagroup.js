import {Cube} from "@datawheel/olap-client";
import {formatAbbreviate} from "d3plus-format";
import maxBy from "lodash/maxBy";
import {buildMemberMap} from "./array";
import {findMeasuresInCube} from "./find";
import {isGeographicLevel, isTimeLevel} from "./validation";

/**
 * @param {Vizbuilder.QueryResult} qr
 * @param {object} props
 * @param {number} props.datacap
 * @param {(level: OlapClient.Level) => Vizbuilder.D3plusConfig} props.getTopojsonConfig
 * @returns {Vizbuilder.Datagroup}
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
  const cutLevels = new Map();
  const drilldowns = [];
  for (const level of cube.levelIterator) {
    for (const item of params.drilldowns) {
      if (level.matches(item)) {
        drilldowns.push(level);
        break;
      }
    }
    for (const item of params.cuts) {
      if (level.matches(item)) {
        cuts.set(level.caption, item.members);
        cutLevels.set(level.caption, level);
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

  const stdDrilldowns = drilldowns.filter(lvl => !isTimeLevel(lvl) && !isGeographicLevel(lvl));

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
    cutLevels,
    locale: params.locale,
    maxPeriod,
    params,
    membersCount,
    members,
    topojsonConfig
  };
}
