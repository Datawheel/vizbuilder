/**
 * Generates an iterator that yields distinct tuples of `n` elements from the input array.
 *
 * This function produces partial permutations, where the order of elements matters, but
 * no element is repeated within a tuple. It continues to generate all possible distinct
 * combinations of `n` elements from the input array, returning each combination as an array.
 *
 * The iteration ends once all valid tuples have been yielded.
 *
 * @param arr - The array of elements from which to generate the tuples.
 * @param n - The number of elements in each tuple. Must be less than or equal to the length of the input array.
 * @returns An iterable iterator that yields arrays of length `n`, each representing a tuple of distinct elements.
 *
 * @example
 * const arr = [1, 2, 3, 4];
 * const iterator = yieldPartialPermutations(arr, 3);
 * for (const tuple of iterator) {
 *   console.log(tuple);
 * }
 * // Output:
 * // [1, 2, 3]
 * // [1, 2, 4]
 * // [1, 3, 4]
 * // [2, 3, 4]
 */
export function yieldPartialPermutations<T>(arr: T[], n: number): IterableIterator<T[], undefined> {
  const indices: number[] = Array(n).fill(0);
  let initialized = false;

  return {
    next: () => {
      if (!initialized) {
        if (arr.length < n) return { done: true };
        for (let i = 0; i < n; i++) {
          indices[i] = i;
        }
        initialized = true;
        return { value: indices.map(idx => arr[idx]), done: false };
      }

      for (let i = n - 1; i >= 0; i--) {
        if (indices[i] < arr.length - (n - i)) {
          indices[i]++;
          for (let j = i + 1; j < n; j++) {
            indices[j] = indices[j - 1] + 1;
          }
          return { value: indices.map(idx => arr[idx]), done: false };
        }
      }

      return { done: true };
    },
    [Symbol.iterator]() {
      return this;
    },
  };
}
