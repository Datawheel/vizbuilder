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

/**
 * Estimate a relative width score for a word (font-independent).
 * A higher number means the word will be visually wider.
 */
export function estimateWordWidth(word: string): number {
  if (!word) return 0;
  // Character classes (lowercase keys)
  const thin = new Set(['1', 'l', 'i', 'j', 't', '\'','|',':',';','!','`']);
  const narrow = new Set(['f', 'r', 'k', 's', 'x', 'c', 'v', 'z', ',', '.','-','"']);
  const normal = new Set([
    'a','b','d','e','g','h','n','o','p','q','u','y',
    'A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'
  ]);
  const wide = new Set(['m','w','M','W']);
  const digitNormal = new Set(['0','2','3','4','5','6','7','8','9']);

  // Base weights (relative units)
  const WEIGHT_THIN = 0.5;
  const WEIGHT_NARROW = 0.8;
  const WEIGHT_NORMAL = 1.0;
  const WEIGHT_WIDE = 1.4;
  const WEIGHT_SPACE = 0.6; // space between words
  const WEIGHT_DIGIT = 0.95;
  const WEIGHT_DEFAULT = 1.0;

  let total = 0;
  for (const ch of word) {
    if (ch === ' ') {
      total += WEIGHT_SPACE;
      continue;
    }
    if (thin.has(ch)) {
      total += WEIGHT_THIN;
      continue;
    }
    if (narrow.has(ch)) {
      total += WEIGHT_NARROW;
      continue;
    }
    if (wide.has(ch)) {
      total += WEIGHT_WIDE;
      continue;
    }
    if (digitNormal.has(ch)) {
      total += WEIGHT_DIGIT;
      continue;
    }
    // categorize letters by case-insensitive check for normal set to avoid listing all uppercase
    const lower = ch.toLowerCase();
    if (normal.has(ch) || normal.has(ch.toUpperCase()) || normal.has(lower)) {
      total += WEIGHT_NORMAL;
      continue;
    }
    // fallback: use default
    total += WEIGHT_DEFAULT;
  }

  return total;
}
