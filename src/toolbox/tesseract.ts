import type {
  Annotations,
  TesseractCube,
  TesseractDimension,
  TesseractHierarchy,
  TesseractLevel,
  TesseractMeasure,
} from "../schema";

/**
 * Retrieves the localized caption from a TesseractEntity object.
 */
export function getCaption(
  item: {annotations: Annotations; caption?: string; name: string},
  locale = "en",
): string {
  const ann = item.annotations;
  return (
    ann[`caption_${locale}`] ||
    ann[`caption_${locale.slice(0, 2)}`] ||
    ann.caption ||
    item.caption ||
    item.name
  );
}

export function yieldAllMeasures(
  cube: TesseractCube,
): IterableIterator<TesseractMeasure> {
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
            value: measure.attached[attachedIndex++],
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
        return {value: cube.measures[measureIndex], done: false};
      }

      return {done: true}; // Done when all measures and attached are iterated
    },
    [Symbol.iterator]() {
      return this;
    },
  };
}

export function yieldDimensionHierarchyLevels(
  cube: TesseractCube,
): IterableIterator<[TesseractDimension, TesseractHierarchy, TesseractLevel]> {
  let i = 0;
  let j = 0;
  let k = 0;

  return {
    next() {
      if (i < cube.dimensions.length) {
        const dimension = cube.dimensions[i];

        if (j < dimension.hierarchies.length) {
          const hierarchy = dimension.hierarchies[j];

          if (k < hierarchy.levels.length) {
            const level = hierarchy.levels[k++];
            return {value: [dimension, hierarchy, level], done: false};
          }
          k = 0; // Reset k for next hierarchy
          j++; // Move to the next hierarchy
        } else {
          j = 0; // Reset j for the next dimension
          i++; // Move to the next dimension
        }

        return this.next(); // Continue to the next valid item
      }

      return {done: true};
    },
    [Symbol.iterator]() {
      return this;
    },
  };
}

export function mapLevelToDimType(cube: TesseractCube) {
  return Object.fromEntries(
    Array.from(yieldDimensionHierarchyLevels(cube), triad => [
      triad[2].name,
      triad[0].type,
    ]),
  );
}
