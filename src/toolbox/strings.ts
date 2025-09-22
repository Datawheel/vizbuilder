import type {DataPoint} from "../charts/datagroup";

/**
 * Serializes a list of strings into an abbreviated, comma-separated enumeration
 * so that the first maxPrinted tokens are shown, and the rest is described as
 * "and N more" if the list is longer.
 *
 * @param list - array of items to print
 * @param limit - default: 2 - max number of items to show befo
 * @returns
 * string in format "item1, ..., itemK, and N-K more", where N is the length of
 * the given array and K is `maxPrinted` param
 */
export function abbreviateList(list: string[], limit = 2): string {
  if (typeof list === "string") return list;
  return (
    list.length > limit
      ? [...list.slice(0, limit), `and ${list.length - limit} more`]
      : list
  ).join(", ");
}

/**
 * Returns the ID column name for a label column name, if exists.
 */
export function getColumnId(columnName: string, dataset: DataPoint[]): string {
  const firstItem = dataset[0];
  if (`ID ${columnName}` in firstItem) return `ID ${columnName}`;
  if (`${columnName} ID` in firstItem) return `${columnName} ID`;
  return columnName;
}
