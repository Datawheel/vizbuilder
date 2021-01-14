import flatMap from "lodash/flatMap";
import groupBy from "lodash/groupBy";
import mapValues from "lodash/mapValues";
import sortBy from "lodash/sortBy";
import uniqBy from "lodash/uniqBy";
import {getColumnId} from "./strings";

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
  const members = Object.fromEntries(
    flatMap(properties, property => {
      const propertyId = getColumnId(property, dataset);
      const uniqueDatasetForProperty = sortBy(
        uniqBy(dataset, d => d[property]),
        d => d[propertyId]
      );
      return Array.from(new Set([property, propertyId]), prop =>
        [prop, uniqueDatasetForProperty.map(d => d[prop])]
      );
    })
  );

  return {members, membersCount: mapValues(members, item => item.length)};
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
 * Yields partial permutations taking k elements from the supplied list.
 * @template T
 * @param {T[]} list
 * @param {number} [k]
 * @param {T[]} [partial]
 * @returns {IterableIterator<T[]>}
 */
export function permutationIterator(list, k = list.length, partial = []) {
  let index = 0;

  if (k === 1) {
    return {
      next() {
        const value = partial.concat([list[index++]]);
        return {value, done: index > list.length};
      },
      [Symbol.iterator]() {
        return this;
      }
    };
  }

  let subiterator = permutationIterator(
    list.slice(1),
    k - 1,
    partial.concat([list[index]])
  );

  /** @type {() => IteratorResult<T[]>} */
  function next() {
    if (index === list.length) {
      return {value: null, done: true};
    }

    const subiteration = subiterator.next();

    if (subiteration.done) {
      index++;
      const nextSubList = list.slice();
      subiterator = permutationIterator(
        nextSubList,
        k - 1,
        partial.concat(nextSubList.splice(index, 1))
      );
      return next();
    }

    return {value: subiteration.value, done: false};
  }

  const iterator = {next, [Symbol.iterator]: () => iterator};
  return iterator;
}

/**
 * @template {Record<string, string | number>} T
 * @param {T[]} dataset
 * @param {object} param1
 * @param {string} param1.mainDrilldownName
 * @param {string} param1.measureName
 * @param {string} param1.timeDrilldownName
 * @returns {T[]}
 */
export function getTopTenByPeriod(dataset, {mainDrilldownName, measureName, timeDrilldownName}) {
  const datasetByPeriod = groupBy(dataset, timeDrilldownName);

  const topTenPointsOfEachPeriod = flatMap(datasetByPeriod, points => sortBy(points, measureName).slice(-10));
  const topTenDrilldownMembers = groupBy(topTenPointsOfEachPeriod, mainDrilldownName);

  if (Object.keys(topTenDrilldownMembers).length < 12) {
    return topTenPointsOfEachPeriod;
  }

  const periodList = Object.keys(datasetByPeriod).sort();
  const lastPeriod = periodList[periodList.length - 1];
  const lastPeriodDataset = sortBy(datasetByPeriod[lastPeriod], measureName).slice(-10);
  const timeElements = groupBy(lastPeriodDataset, mainDrilldownName);
  return dataset.filter(item => timeElements.hasOwnProperty(item[mainDrilldownName]));
}
