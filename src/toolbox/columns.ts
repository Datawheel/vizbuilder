import type {
  TesseractCube,
  TesseractDimension,
  TesseractHierarchy,
  TesseractLevel,
  TesseractMeasure,
  TesseractProperty,
} from "../schema";
import {yieldLevels, yieldMeasures, yieldProperties} from "./tesseract";

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

function buildEntityMap(cube: TesseractCube): {
  [K: string]:
    | [TesseractMeasure, TesseractMeasure | undefined]
    | [TesseractLevel, TesseractHierarchy, TesseractDimension]
    | [TesseractProperty, TesseractLevel, TesseractHierarchy, TesseractDimension];
} {
  return Object.fromEntries([
    ...Array.from(yieldMeasures(cube), item => [item[0].name, item]),
    ...Array.from(yieldLevels(cube), item => [item[0].name, item]),
    ...Array.from(yieldProperties(cube), item => [item[0].name, item]),
  ]);
}

export function buildColumn(cube: TesseractCube, name: string): Column {
  const map = buildEntityMap(cube);
  const entity = map[name] || map[name.replace(/\sID$/, "")] || [];

  if (entity.length === 2) {
    return {
      name,
      type: "measure",
      measure: entity[0],
      parentMeasure: entity[1],
      parentRelationship: undefined, // TODO
    };
  }

  if (entity.length === 3) {
    return {
      name,
      type: "level",
      dimension: entity[2],
      hierarchy: entity[1],
      level: entity[0],
      isID: name !== name.replace(/\sID$/, ""),
    };
  }

  if (entity.length === 4) {
    return {
      name,
      type: "property",
      dimension: entity[3],
      hierarchy: entity[2],
      level: entity[1],
      property: entity[0],
    };
  }

  throw new Error(`Missing entity in cube '${cube.name}': ${name}`);
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

/** */
export function getAnnotation(
  column: Column,
  annotation: string,
  locale = "en",
): string | undefined {
  const ann = getColumnEntity(column).annotations;
  return (
    ann[`${annotation}_${locale}`] ||
    ann[`${annotation}_${locale.slice(0, 2)}`] ||
    ann[annotation]
  );
}

/**
 * Retrieves the localized caption from a Column.
 */
export function getCaption(column: Column, locale = "en"): string {
  const item = getColumnEntity(column);
  return getAnnotation(column, "caption", locale) || item.caption || item.name;
}
