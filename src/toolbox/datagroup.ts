import groupBy from "lodash/groupBy";
import mapValues from "lodash/mapValues";
import max from "lodash/max";
import min from "lodash/min";
import {
  type DataPoint,
  DimensionType,
  type TesseractDimension,
  type TesseractHierarchy,
  type TesseractLevel,
  type TesseractMeasure,
  type TesseractProperty,
} from "../schema";
import type {Dataset} from "../structs";
import {filterMap} from "./array";
import type {Column, LevelColumn} from "./columns";
import {isOneOf} from "./validation";

export type PrimitiveType = "string" | "number" | "boolean";

export interface Datagroup {
  columns: Record<string, Column>;
  dataset: DataPoint[];
  locale: string;

  measureColumns: {
    measure: TesseractMeasure;
    parentMeasure?: TesseractMeasure;
    range: [number, number];
  }[];

  // We assume a unique time hierarchy in the data
  timeHierarchy?: CategoryAxis;

  // Keys are Hierarchy names
  nonTimeHierarchies: {[K: string]: CategoryAxis};
}

export interface CategoryAxis {
  dimension: TesseractDimension;
  hierarchy: TesseractHierarchy;
  levels: AxisSeries[];
}

export interface AxisSeries {
  name: string;
  type: PrimitiveType;
  members: string[] | number[] | boolean[];
  level: TesseractLevel;
  properties: TesseractProperty[];
  captions: {
    // Keys are Column.name, not LevelCaption.entity.name
    [K: string]: LevelCaption;
  };
}

export interface LevelCaption {
  entity: TesseractLevel | TesseractProperty;
  type: PrimitiveType;
  members: string[] | number[] | boolean[];
}

/** */
export function buildDatagroup(ds: Dataset): Datagroup {
  const {columns, data, locale} = ds;

  const collator = new Intl.Collator(locale, {numeric: true, ignorePunctuation: false});

  const columnList = Object.values(columns);

  const measureColumns = columnList.filter(column => column.type === "measure");

  const levelColumns = columnList.filter(column => column.type === "level");

  const propertyColumns = groupBy(
    columnList.filter(column => column.type === "property"),
    column => column.level.name,
  );

  const timeColumns = levelColumns.filter(
    column => column.dimension.type === DimensionType.TIME,
  );

  const nonTimeColumns = groupBy(
    levelColumns.filter(column => column.dimension.type !== DimensionType.TIME),
    column => column.hierarchy.name,
  );

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
    nonTimeHierarchies: mapValues(nonTimeColumns, adaptLevelList),
  };

  /**
   * We assume all columns in the array belong to the same hierarchy.
   */
  function adaptLevelList(columns: LevelColumn[]): CategoryAxis {
    const captionColumnMap = Object.fromEntries(
      filterMap(columns, column => {
        const propColumns = propertyColumns[column.level.name] || [];
        return column.isID ? null : [column.name, [column, ...propColumns]];
      }),
    );
    return {
      dimension: columns[0].dimension,
      hierarchy: columns[0].hierarchy,
      levels: columns
        .filter(column => column.isID)
        .sort((a, b) => a.level.depth - b.level.depth)
        .map(column => {
          const {level} = column;
          const columnNameWithoutID = column.name.replace(/\sID$/, "");
          const propColumns = propertyColumns[level.name] || [];
          const captionColumns = captionColumnMap[columnNameWithoutID] || propColumns;
          const members = getUniqueMembers<string>(data, column.name).sort(
            collator.compare,
          );

          return {
            name: column.name,
            type: getTypeFromMembers(members),
            members,
            level,
            properties: propColumns.map(column => column.property),
            captions: Object.fromEntries(
              captionColumns.map(column => {
                const entity = column.property || column.level;
                const members = getUniqueMembers<string>(data, column.name).sort(
                  collator.compare,
                );
                const type = getTypeFromMembers(members);
                return [column.name, {entity, type, members}];
              }),
            ),
          };
        }),
    };
  }
}

function getUniqueMembers<T>(dataset: DataPoint[], column: string): T[] {
  return [...new Set(dataset.slice(0, 5e5).map(row => row[column]))] as T[];
}

function getTypeFromMembers(members: unknown[]) {
  const types = new Set(members.map(item => typeof item));
  if (types.size > 1) {
    throw new Error(`Dataset contains a column multiple data types: ${types}`);
  }
  const value = [...types][0];
  if (!isOneOf(value, ["string", "number", "boolean"])) {
    throw new Error(`Invalid data type in dataset: ${value}`);
  }
  return value;
}
