// TODO: restore
// /**
//  * @param {any[]} data
//  * @param {string} measureName
//  */
// export function inyectShare(data, measureName) {
//   const total = sumBy(data, measureName);
//   const extendedData = [];

//   let n = data.length;
//   while (n--) {
//     const point = Object.assign({}, data[n]);
//     extendedData[n] = Object.defineProperty(point, `${measureName} Share`, {
//       enumerable: true,
//       value: point[measureName] / total
//     });
//   }
//   return extendedData;
// }

// TODO: restore
// /**
//  * @param {any[]} data
//  * @param {string} timeLevelName
//  * @param {string} measureName
//  */
// export function inyectShareByTime(data, measureName, timeLevelName) {
//   const timedData = groupBy(data, timeLevelName);
//   const groups = Object.values(timedData);
//   const extendedData = [];

//   let n = groups.length;
//   while (n--) {
//     const extendedGroup = inyectShare(groups[n], measureName);
//     extendedData.push(...extendedGroup);
//   }
//   return extendedData;
// }

/**
 * @param {number[]} values
 * @returns {number}
 */
export function sum(values) {
  let sum = 0;
  let i = values.length;
  while (i--) {
    sum += values[i];
  }
  return sum;
}

/**
 * @param {number[]} values
 * @returns {number}
 */
export function mean(values) {
  return sum(values) / values.length;
}

/**
 * Calculate the Relative Standard Deviation
 * This means it should have a numeric value, and a valid operator.
 * @param {any[]} data An array to check
 * @param {string} measureName Name of the measure
 */
export function relativeStdDev(data, measureName) {
  const dataPoints = data.map(d => d[measureName]);
  return dataPoints.length > 0
    ? Math.sqrt(variance(dataPoints)) / mean(dataPoints)
    : NaN;
}

/**
 * @param {number[]} values
 * @returns {number}
 */
export function variance(values) {
  let count = 0;
  let delta;
  let mean = 0;
  let sum = 0;
  let i = values.length;
  while (i--) {
    delta = values[i] - mean;
    mean += delta / ++count;
    sum += delta * (values[i] - mean);
  }
  return count > 1 ? sum / (count - 1) : NaN;
}

/**
 * @param {number} value
 * @param {number} min
 * @param {number} max
 */
export function isBetween(min, max, value) {
  return value > min && value < max;
}

/**
 * A string hashing function based on Daniel J. Bernstein's popular 'times 33' hash algorithm.
 * Returns a short string made up only with characters [0-9A-Z].
 * @param {string} text String to hash
 * @returns {string}
 */
export function shortHash(text) {
  let hash = 5381;
  let index = text.length;
  while (index--) {
    hash = (hash * 33) ^ text.charCodeAt(index);
  }
  return (hash >>> 0).toString(36);
}
