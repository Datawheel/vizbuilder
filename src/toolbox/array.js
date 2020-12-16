import flatMap from "lodash/flatMap";
import groupBy from "lodash/groupBy";

/**
 * @template T
 * @param {T | T[] | undefined} content
 * @param {T[]} [target]
 * @returns {T[]}
 */
export function asArray(content, target = []) {
  return target.concat(content).filter(Boolean);
}

/**
 * @param {any[]} dataset
 * @param {string[]} properties
 * @returns {{members: Record<string, any[]>, membersCount: Record<string, number>}}
 */
export function buildMemberMap(dataset, properties) {
  let p = properties.length;

  /** @type {Record<string, any[]>} */
  const members = {};

  /** @type {Record<string, number>} */
  const membersCount = {};

  while (p--) {
    const property = `${properties[p]}`;
    const memberSet = new Set(dataset.map(item => item[property]));
    members[property] = Array.from(memberSet).sort();
    membersCount[property] = memberSet.size;
  }

  return {members, membersCount};
}

/**
 * Returns an array of permutations taking 2 elements from the supplied array.
 * @template T
 * @param {T[]} set
 * @param {T[][]} result
 */
export function getPermutations(set, result = []) {
  if (set.length === 0) return [];

  const permute = (arr, m = []) => {
    if (arr.length === 0) {
      result.push(m);
    }
    else {
      for (let i = 0; i < arr.length; i++) {
        const curr = arr.slice();
        const next = curr.splice(i, 1);
        permute(curr.slice(), m.concat(next));
      }
    }
  };

  permute(set);

  return result;
}

/**
 * TODO: Convert to generalized time
 * @template {Record<string, string | number>} T
 * @param {T[]} dataset
 * @param {object} param1
 * @param {string} param1.firstDrilldownName
 * @param {string} param1.timeDrilldownName
 * @returns {T[]}
 */
export function getTopTenByYear(dataset, {firstDrilldownName, timeDrilldownName}) {
  const datasetByPeriod = groupBy(dataset, timeDrilldownName);

  const topTenPointsOfEachPeriod = flatMap(
    Object.keys(datasetByPeriod),
    period => datasetByPeriod[period].slice(0, 10)
  );
  const topTenDrilldownMembers = groupBy(topTenPointsOfEachPeriod, firstDrilldownName);

  if (Object.keys(topTenDrilldownMembers).length < 12) {
    return topTenPointsOfEachPeriod;
  }

  const periodList = Object.keys(datasetByPeriod).sort();
  const lastPeriod = periodList[periodList.length - 1];
  const timeElements = groupBy(datasetByPeriod[lastPeriod].slice(0, 10), firstDrilldownName);
  return dataset.filter(item => item[firstDrilldownName] in timeElements);
}
