import type {
  TesseractCube,
  TesseractDimension,
  TesseractHierarchy,
  TesseractLevel,
  TesseractMeasure,
  TesseractProperty,
} from "@datawheel/logiclayer-client";
import {getAnnotation, yieldLevels, yieldMeasures, yieldProperties} from "./tesseract";

export type Column = MeasureColumn | LevelColumn | PropertyColumn;

export interface MeasureColumn {
  name: string;
  type: "measure";
  measure: TesseractMeasure;
  parentMeasure: TesseractMeasure | undefined;
  parentRelationship: "collection" | "source" | "moe" | "uci" | "lci" | undefined;
}

export interface LevelColumn {
  name: string;
  type: "level";
  dimension: TesseractDimension;
  hierarchy: TesseractHierarchy;
  level: TesseractLevel;
  property?: undefined;
  hasID: boolean;
  isID: boolean;
}

export interface PropertyColumn {
  name: string;
  type: "property";
  dimension: TesseractDimension;
  hierarchy: TesseractHierarchy;
  level: TesseractLevel;
  property: TesseractProperty;
}

function next<T>(iterable: Iterator<T>, condition: (item: T) => boolean): T | undefined {
  let result = iterable.next();
  while (!result.done) {
    if (condition(result.value)) return result.value;
    result = iterable.next();
  }
}

export function buildColumn(
  cube: TesseractCube,
  name: string,
  columns: string[],
): Column {
  const nameWithoutID = name.replace(/\sID$/, "");
  const nameWithID = `${nameWithoutID} ID`;

  const maybeMeasure = next(yieldMeasures(cube), item => item[0].name === name);
  if (maybeMeasure) {
    const [measure, parentMeasure] = maybeMeasure;
    return {
      name,
      type: "measure",
      measure,
      parentMeasure,
      parentRelationship: undefined, // TODO
    };
  }

  const maybeLevel = next(
    yieldLevels(cube),
    item => item[0].name === nameWithoutID || item[0].name === nameWithID,
  );
  if (maybeLevel) {
    const [level, hierarchy, dimension] = maybeLevel;
    const hasID = columns.includes(nameWithID);
    return {
      name,
      type: "level",
      dimension,
      hierarchy,
      level,
      isID: !hasID || name === nameWithID,
      hasID,
    };
  }

  const maybeProperty = next(yieldProperties(cube), item => item[0].name === name);
  if (maybeProperty) {
    const [property, level, hierarchy, dimension] = maybeProperty;
    return {
      name,
      type: "property",
      dimension,
      hierarchy,
      level,
      property,
    };
  }

  throw new Error(`Missing entity in cube '${cube.name}': ${nameWithoutID}`);
}

/**
 * Retrieves the main entity for the Column.
 */
export function getColumnEntity(column: Column) {
  if (column.type === "measure") return column.measure;
  if (column.type === "level") return column.level;
  if (column.type === "property") return column.property;
  throw new Error("Invalid column object");
}

/**
 * Retrieves the localized caption from a Column.
 */
export function getCaption(column: Column, locale = "en"): string {
  const item = getColumnEntity(column);
  return getAnnotation(item, "caption", locale) || item.caption || item.name;
}
