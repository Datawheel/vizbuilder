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

/**
 * Returns the ID column name for a label column name, if exists.
 *
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
 * Retrieves the caption property from a OlapClient entity object.
 *
 * @param {object} item
 * @param {Record<string, string | undefined>} item.annotations
 * @param {string} [item.caption]
 * @param {string} item.name
 * @param {string} [locale]
 */
export function getCaption(item, locale = "en") {
  const ann = item.annotations;
  return ann[`caption_${locale}`] || ann[`caption_${locale.slice(0, 2)}`] || ann.caption || item.caption || item.name;
}
