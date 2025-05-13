import {groupBy, mapValues, max, min} from "lodash-es";
import {
  type DataPoint,
  DimensionType,
  type TesseractDimension,
  type TesseractHierarchy,
  type TesseractLevel,
  type TesseractMeasure,
  type TesseractProperty,
} from "../schema";
import {filterMap} from "../toolbox/array";
import type {Column, LevelColumn} from "../toolbox/columns";
import {isOneOf} from "../toolbox/validation";
import type {Dataset} from "../types";

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
  sumByMember: Record<string | number, {[K: string]: number}>;
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

  // Remove rows intended to be excluded from viz by directive
  const exclusionRules = filterMap(levelColumns, (column): [string, string[]] | null => {
    const exclude = column.level.annotations.vb_exclude_members?.split(",") || [];
    return column.isID && exclude.length > 0 ? [column.name, exclude] : null;
  });
  const exclusionFilter = exclusionRules.reduce<(row: DataPoint) => boolean>(
    (fn, rule) => {
      const [columnID, exclude] = rule;
      return row => fn(row) && !exclude.includes(`${row[columnID]}`);
    },
    () => true,
  );
  const dataset = data.filter(exclusionFilter);
  // TODO: add 'uncategorized' difference rows

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

  // Warning: we are just precalculating here to share on many functions
  // later stages are responsible to check if these sums are meaningful
  const sumByMemberAnalysis = calculateSumByMember(dataset, columns);

  return {
    columns,
    dataset,
    locale,
    measureColumns: measureColumns.map(column => {
      const members = getUniqueMembers<number>(dataset, column.name);
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
          const sumByMember = sumByMemberAnalysis[column.name];
          const members = getUniqueMembers<string>(dataset, column.name).sort(
            collator.compare,
          );

          return {
            name: column.name,
            type: getTypeFromMembers(members),
            members,
            sumByMember,
            level,
            properties: propColumns.map(column => column.property),
            captions: Object.fromEntries(
              captionColumns.map(column => {
                const entity = column.property || column.level;
                const members = getUniqueMembers<string>(dataset, column.name).sort(
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

/**
 * For the provided array of record objects, extracts a list of unique values
 * for the specified column. For performance reasons, it only considers the
 * first 500000 records in the array.
 */
function getUniqueMembers<T>(dataset: DataPoint[], column: string): T[] {
  return [...new Set(dataset.slice(0, 5e5).map(row => row[column]))] as T[];
}

/**
 * Under the assumption all the values in the provided array are primitives and
 * of same type (function throws if not), returns the name of type of primitive
 * the array is made of.
 */
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

/**
 * Sums the Measure values for each distinct Member of the Level in the dataset.
 *
 * @returns An object where each category key maps to its distinct values, and each value contains the summed measurements.
 *
 * @example
 * const dataset = [
 *   { Continent: 'A', Country: 'X', Quantity: 10, "Trade Value": 5 },
 *   { Continent: 'A', Country: 'X', Quantity: 15, "Trade Value": 10 },
 *   { Continent: 'B', Country: 'Y', Quantity: 20, "Trade Value": 25 },
 *   { Continent: 'A', Country: 'Y', Quantity: 5, "Trade Value": 5 }
 * ];
 * console.log(calculateSumByMember(dataset, columns));
 * // {
 * //   "Continent": {
 * //     "A": { "Quantity": 30, "Trade Value": 20 },
 * //     "B": { "Quantity": 20, "Trade Value": 25 }
 * //   },
 * //   "Country": {
 * //     "X": { "Quantity": 25, "Trade Value": 15 },
 * //     "Y": { "Quantity": 25, "Trade Value": 30 }
 * //   }
 * // }
 */
function calculateSumByMember(dataset: DataPoint[], columns: Record<string, Column>) {
  const columnList = Object.values(columns);

  const levelNames = filterMap(columnList, column =>
    column.type === "level" && column.isID ? column.name : null,
  );
  const measureNames = filterMap(columnList, column =>
    column.type === "measure" ? column.name : null,
  );

  return Object.fromEntries(
    levelNames.map(levelName => {
      const memberMap: Record<string, Record<string, number>> = {};

      // Iterate through the records
      for (const row of dataset) {
        const member = row[levelName] as string;
        const measureMap =
          memberMap[member] ||
          Object.fromEntries(measureNames.map(measure => [measure, 0]));

        // Sum the measurements for this category value
        for (const measure of measureNames) {
          measureMap[measure] += row[measure] as number;
        }

        memberMap[member] = measureMap;
      }

      return [levelName, memberMap];
    }),
  );
}
