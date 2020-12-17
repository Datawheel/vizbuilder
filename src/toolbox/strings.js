import {Cube} from "@datawheel/olap-client";
import {findHigherCurrentPeriod, findLevelInCube} from "./find";
import {isTimeLevel} from "./validation";

/**
 * @param {string} columnName 
 * @param {any[]} dataset 
 */
export function getColumnId(columnName, dataset) {
  const firstItem = dataset[0];
  if (`ID ${columnName}` in firstItem) return `ID ${columnName}`;
  if (`${columnName} ID` in firstItem) return `${columnName} ID`;
  return columnName;
}

/**
 * @param {VizBldr.QueryResult} query
 */
export function getDefaultPeriod(query) {
  const cube = new Cube(query.cube);
  const {drilldowns} = query.params;

  let timeLevel;
  for (let i = 0; i < drilldowns.length; i++) {
    const level = findLevelInCube(cube, drilldowns[i]);
    if (level && isTimeLevel(level)) {
      timeLevel = level;
      break;
    }
  }
  if (!timeLevel) return "";

  const captionId = getColumnId(timeLevel.caption, query.dataset);
  const timeMembers = new Set(query.dataset.map(d => d[captionId]));
  return findHigherCurrentPeriod([...timeMembers]);
}
