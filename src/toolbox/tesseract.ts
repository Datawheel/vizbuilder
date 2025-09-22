import type {
  Annotations,
  TesseractCube,
  TesseractDimension,
  TesseractMeasure,
} from "@datawheel/logiclayer-client";

/**
 * Retrieves a localized annotation value.
 */
export function getAnnotation<T extends Annotations, K extends string>(
  entity: {annotations: T},
  annotation: K,
  locale = "en",
): T[K] {
  const ann = entity.annotations;
  return (
    (ann[`${annotation}_${locale}`] as T[K]) ||
    (ann[`${annotation}_${locale.slice(0, 2)}`] as T[K]) ||
    ann[annotation]
  );
}

export function yieldMeasures(
  cube: TesseractCube,
): IterableIterator<[TesseractMeasure, TesseractMeasure | undefined], undefined> {
  let measureIndex = 0;
  let attachedIndex = 0;
  let inAttached = false;

  return {
    next() {
      // If we're iterating over attached measures
      if (inAttached) {
        const measure = cube.measures[measureIndex];
        if (attachedIndex < measure.attached.length) {
          return {
            value: [measure.attached[attachedIndex++], measure],
            done: false,
          };
        }
        // Move to the next measure after finishing attached measures
        inAttached = false;
        attachedIndex = 0;
        measureIndex++;
      }

      // If we're iterating over measures
      if (measureIndex < cube.measures.length) {
        inAttached = true; // Switch to attached measures
        return {value: [cube.measures[measureIndex], undefined], done: false};
      }

      return {done: true}; // Done when all measures and attached are iterated
    },
    [Symbol.iterator]() {
      return this;
    },
  };
}

export function yieldDimensions(
  cube: TesseractCube,
): IterableIterator<[TesseractDimension]> {
  let i = 0;
  return {
    next() {
      if (i < cube.dimensions.length) {
        const dimension = cube.dimensions[i++];
        return {value: [dimension], done: false};
      }
      return {value: undefined, done: true};
    },
    [Symbol.iterator]() {
      return this.next();
    },
  };
}

export function yieldHierarchies(cube: TesseractCube) {
  return createGenerator(
    () => yieldDimensions(cube),
    item => item[0].hierarchies,
  );
}

export function yieldLevels(cube: TesseractCube) {
  return createGenerator(
    () => yieldHierarchies(cube),
    item => item[0].levels,
  );
}

export function yieldProperties(cube: TesseractCube) {
  return createGenerator(
    () => yieldLevels(cube),
    item => item[0].properties,
  );
}

function createGenerator<T extends unknown[], U>(
  baseIterator: () => IterableIterator<T>,
  extractItems: (item: T) => U[],
): IterableIterator<[U, ...T], undefined> {
  const iterator = baseIterator();
  let currentItem = iterator.next();
  let index = 0;

  return {
    next() {
      while (!currentItem.done) {
        const item = currentItem.value;
        const items = extractItems(item);
        if (index < items.length) {
          return {value: [items[index++], ...item], done: false};
        }
        index = 0; // Reset for the next base item
        currentItem = iterator.next(); // Move to the next base item
      }
      return {value: undefined, done: true};
    },
    [Symbol.iterator]() {
      return this;
    },
  };
}
