import groupBy from "lodash/groupBy";
import mapValues from "lodash/mapValues";
import max from "lodash/max";
import min from "lodash/min";
import {
  DimensionType,
  type TesseractDimension,
  type TesseractHierarchy,
  type TesseractLevel,
  type TesseractMeasure,
  type TesseractProperty,
} from "../schema";
import type {Dataset} from "../structs";
import type {Column, LevelColumn} from "./columns";

export interface Datagroup {
  columns: Record<string, Column>;
  dataset: Record<string, unknown>[];
  locale: string;

  measureColumns: {
    measure: TesseractMeasure;
    parentMeasure?: TesseractMeasure;
    range: [number, number];
  }[];

  // We assume a unique time hierarchy in the data
  timeHierarchy?: {
    dimension: TesseractDimension;
    hierarchy: TesseractHierarchy;
    levels: TesseractLevel[];
    hasID: Record<string, boolean>;
    members: Record<string, number[]>;
  };

  geoHierarchies: {
    // Keys are Hierarchy names
    [K: string]: {
      dimension: TesseractDimension;
      hierarchy: TesseractHierarchy;
      levels: TesseractLevel[];
      hasID: Record<string, boolean>;
      members: Record<string, number[]>;
    };
  };

  stdHierarchies: {
    // Keys are Hierarchy names
    [K: string]: {
      dimension: TesseractDimension;
      hierarchy: TesseractHierarchy;
      levels: TesseractLevel[];
      hasID: Record<string, boolean>;
      members: Record<string, number[]>;
    };
  };

  propertyColumns: {
    // Keys are Level names
    [K: string]: {
      dimension: TesseractDimension;
      hierarchy: TesseractHierarchy;
      level: TesseractLevel;
      properties: TesseractProperty[];
    };
  };
}

/** */
export function buildDatagroup(ds: Dataset): Datagroup {
  const {columns, data, locale} = ds;

  const columnList = Object.values(columns);

  const measureColumns = columnList.filter(column => column.type === "measure");
  const levelColumns = columnList
    .filter(column => column.type === "level")
    .filter(column => !column.isID);
  const propertyColumns = columnList.filter(column => column.type === "property");

  const levelHasID = Object.fromEntries(
    levelColumns.map(column => [column.name, `${column.name} ID` in columns]),
  );

  const timeColumns = levelColumns
    .filter(column => column.dimension.type === DimensionType.TIME)
    .sort((a, b) => a.level.depth - b.level.depth);

  const geoColumns = levelColumns
    .filter(column => column.dimension.type === DimensionType.GEO)
    .sort((a, b) => a.level.depth - b.level.depth);

  const stdColumns = levelColumns
    .filter(column => column.dimension.type === DimensionType.STANDARD)
    .sort((a, b) => a.level.depth - b.level.depth);

  return {
    columns,
    dataset: data,
    locale,
    measureColumns: measureColumns.map(column => {
      const members = getUniqueMembers<number>(data, column.name);
      return {
        measure: column.measure,
        parentMeasure: column.parentMeasure,
        range: [min(members) ?? Number.NaN, max(members) ?? Number.NaN],
      };
    }),
    timeHierarchy: timeColumns.length ? adaptLevelList(timeColumns) : undefined,
    geoHierarchies: mapValues(
      groupBy(geoColumns, column => column.hierarchy.name),
      adaptLevelList,
    ),
    stdHierarchies: mapValues(
      groupBy(stdColumns, column => column.hierarchy.name),
      adaptLevelList,
    ),
    propertyColumns: mapValues(
      groupBy(propertyColumns, column => column.level.name),
      columns => ({
        dimension: columns[0].dimension,
        hierarchy: columns[0].hierarchy,
        level: columns[0].level,
        properties: columns.map(column => column.property),
        members: Object.fromEntries(
          columns.map(column => {
            return [column.name, getUniqueMembers<string>(data, column.name).sort()];
          }),
        ),
      }),
    ),
  };

  function adaptLevelList(columns: LevelColumn[]) {
    return {
      dimension: columns[0].dimension,
      hierarchy: columns[0].hierarchy,
      levels: columns.map(column => column.level),
      hasID: Object.fromEntries(
        columns.map(column => [column.name, levelHasID[column.name]]),
      ),
      members: Object.fromEntries(
        columns.map(column => {
          return [column.name, getUniqueMembers<number>(data, column.name).sort()];
        }),
      ),
    };
  }
}

function getUniqueMembers<T>(dataset: Record<string, unknown>[], column: string) {
  return [...new Set(dataset.map(row => row[column]))] as T[];
}
