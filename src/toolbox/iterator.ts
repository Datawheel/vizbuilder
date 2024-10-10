/**
 * Yields partial permutations taking k elements from the supplied list.
 */
export function yieldSubsets<T>(
  list: T[],
  k: number = list.length,
  partial: T[] = [],
): IterableIterator<T[]> {
  let index = 0;

  if (k === 1) {
    return {
      next() {
        const value = partial.concat([list[index++]]);
        return {value, done: index > list.length};
      },
      [Symbol.iterator]() {
        return this;
      },
    };
  }

  let subiterator = yieldSubsets(list.slice(1), k - 1, partial.concat([list[index]]));

  return {
    next() {
      if (index === list.length) {
        return {value: null, done: true};
      }

      const subiteration = subiterator.next();

      if (subiteration.done) {
        index++;
        const nextSubList = list.slice();
        subiterator = yieldSubsets(
          nextSubList,
          k - 1,
          partial.concat(nextSubList.splice(index, 1)),
        );
        return this.next();
      }

      return {value: subiteration.value, done: false};
    },
    [Symbol.iterator]() {
      return this;
    },
  };
}

/**
 * Returns an array of permutations taking 2 elements from the supplied array.
 */
export function yieldPermutations<T>(arr: T[]): IterableIterator<[T, T], undefined> {
  let i = 0;
  let j = 0;

  return {
    next: () => {
      while (i < arr.length) {
        if (i !== j && j < arr.length) {
          return {value: [arr[i], arr[j++]], done: false};
        }
        j = 0;
        i++;
      }
      return {done: true};
    },
    [Symbol.iterator]() {
      return this;
    },
  };
}
