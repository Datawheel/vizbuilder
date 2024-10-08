/** Returns the last object in the array. */
export function getLast<T>(list: T[]): T {
  return list[list.length - 1];
}

/** Converts the provided object into an array. */
export function castArray<T>(content: T | T[] | null | undefined): T[] {
  if (content == null) return [];
  return ([] as T[]).concat(content);
}

/**
 * Performs a filter operation and a map operation in a single iteration.
 * Mapped values that return null are ignored from the output.
 */
export function filterMap<T, U>(
  items: T[],
  callback: (item: T, index: number, array: T[]) => U | null,
): U[] {
  const output = [] as U[];
  for (let i = 0; i < items.length; i++) {
    const result = callback(items[i], i, items);
    result !== null && output.push(result);
  }
  return output;
}

/**
 * Returns an array of permutations taking 2 elements from the supplied array.
 */
export function getPermutations<T>(set: T[], result: T[][] = []) {
  if (set.length === 0) return [];

  const permute = (arr, m = []) => {
    if (arr.length === 0) {
      result.push(m);
    } else {
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
