/**
 * Yields partial permutations taking k elements from the supplied list.
 */
export function yieldPermutations<T>(
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

  let subiterator = yieldPermutations(
    list.slice(1),
    k - 1,
    partial.concat([list[index]]),
  );

  return {
    next() {
      if (index === list.length) {
        return {value: null, done: true};
      }

      const subiteration = subiterator.next();

      if (subiteration.done) {
        index++;
        const nextSubList = list.slice();
        subiterator = yieldPermutations(
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
