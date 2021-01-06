import {Cube} from "@datawheel/olap-client";
import {findHigherCurrentPeriod, findLevelInCube} from "./find";
import {isTimeLevel} from "./validation";

/**
 * Returns the ID column name for a label column name, if exists.
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
 * @returns {string}
 */
export function getDefaultPeriod(query) {
  const cube = new Cube(query.cube);
  const {drilldowns, measures} = query.params;

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
  const periodSet = measures.map(({measure}) => {
    const timeMembers = new Set(
      query.dataset.filter(d => d[measure] != 0).map(d => d[captionId])
    );
    return findHigherCurrentPeriod([...timeMembers]);
  });
  return periodSet.sort()[0];
}
