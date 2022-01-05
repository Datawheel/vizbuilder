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
 * 
 * @param {*} arr 
 * @param {*} maxPrinted 
 * @returns 
 */
export function abbreviateList(arr, maxPrinted = 2) {
  if (!Array.isArray(arr)) return arr;

  return (arr.length > maxPrinted
    ? [...arr.slice(0, maxPrinted), `and ${arr.length - maxPrinted} more`]
    : arr
  ).join(", ");
}    
