/**
 * Returns the ID column name for a label column name, if exists.
 * @param {string} columnName 
 * @param {any[]} dataset
 * @returns {string}
 */
export function getColumnId(columnName, dataset) {
  const firstItem = dataset[0];
  if (`ID ${columnName}` in firstItem) return `ID ${columnName}`;
  if (`${columnName} ID` in firstItem) return `${columnName} ID`;
  return columnName;
}

/**
 * Returns a string of an abbreviated list of items so that only the first 
 * few elements are shown if there are more items than the `maxPrinted` param.
 * 
 * @param {any[]} arr -- array of items to print
 * @param {number} maxPrinted - default: 2 - max number of items to show befo
 * @returns {string} string in format "item1, ..., itemK, and N-K more" where N
 *                   is the length of the given array and K is `maxPrinted` param
 */
export function abbreviateList(arr, maxPrinted = 2) {
  if (!Array.isArray(arr)) return arr;

  return (arr.length > maxPrinted
    ? [...arr.slice(0, maxPrinted), `and ${arr.length - maxPrinted} more`]
    : arr
  ).join(", ");
}    
