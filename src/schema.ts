export enum Aggregator {
  AVERAGE = "Average",
  COUNT = "Count",
  MAX = "Max",
  MEDIAN = "Median",
  MIN = "Min",
  MODE = "Mode",
  SUM = "Sum",
  BASICGROUPEDMEDIAN = "BasicGroupedMedian",
  CALCULATEDMOE = "CalculatedMoe",
  QUANTILE = "Quantile",
  REPLICATEWEIGHTMOE = "ReplicateWeightMoe",
  WEIGHTEDAVERAGE = "WeightedAverage",
  WEIGHTEDAVERAGEMOE = "WeightedAverageMoe",
  WEIGHTEDSUM = "WeightedSum",
  DISTINCTCOUNT = "DistinctCount",
}

export enum ColumnType {
  BOOLEAN = "bool",
  DATE = "date",
  TIME = "time",
  DATETIME = "dttm",
  TIMESTAMP = "stmp",
  FLOAT32 = "f32",
  FLOAT64 = "f64",
  INT8 = "i8",
  INT16 = "i16",
  INT32 = "i32",
  INT64 = "i64",
  INT128 = "i128",
  UINT8 = "u8",
  UINT16 = "u16",
  UINT32 = "u32",
  UINT64 = "u64",
  UINT128 = "u128",
  STRING = "str",
}

export enum Comparison {
  "!=" = "neq",
  "<" = "lt",
  "<=" = "lte",
  "<>" = "neq",
  "=" = "eq",
  ">" = "gt",
  ">=" = "gte",
  eq = "eq",
  EQ = "eq",
  gt = "gt",
  GT = "gt",
  gte = "gte",
  GTE = "gte",
  lt = "lt",
  LT = "lt",
  lte = "lte",
  LTE = "lte",
  NEQ = "neq",
  neq = "neq",
}

export enum DimensionType {
  GEO = "geo",
  STANDARD = "standard",
  TIME = "time",
}

export enum Format {
  csv = "csv",
  jsonarrays = "jsonarrays",
  jsonrecords = "jsonrecords",
  parquet = "parquet",
  tsv = "tsv",
  xlsx = "xlsx",
}

export enum Order {
  asc = "asc",
  desc = "desc",
}

export type Annotations = {
  /** Instructs front-ends to skip listing the specified element in a user-interface */
  hide_in_ui?: "true";
  /** Do not display this element on a map */
  hide_in_map?: "true";

  [K: string]: string | undefined;
};

export type DataPoint = Record<string, unknown>;

export interface TesseractDataRequest {
  cube: string;

  /**
   * @example LevelName,LevelName,LevelName
   */
  drilldowns: string;

  /**
   * @example Measure,Measure,Measure
   */
  measures: string;

  /**
   * @example Level:key,key,key;Level:key,key,key
   */
  exclude?: string;

  /**
   * @example Measure.gt.10000.and.lt.60000,Measure.lt.100000
   */
  filters?: string;

  /**
   * @example Level:key,key,key;Level:key,key,key
   */
  include?: string;

  /**
   * A single number is limit; a pair of numbers are limit, offset.
   * @example 2,5
   */
  limit?: string;

  /**
   * @example es
   */
  locale?: string;

  /**
   * A boolean enables parents for all levels in the request.
   * You can also pick specific Levels from the drilldown list.
   * @example true
   * @example Level,Level
   */
  parents?: boolean | string;

  /**
   * @example Property,Property
   */
  properties?: string;

  /**
   * A boolean sets rankings for all measures in descending order.
   * If setting measure names, orden can be set with or without a leading minus.
   * @example true
   * @example Measure,-Measure
   */
  ranking?: boolean | string;

  /**
   * @example Measure.asc
   * @example Property.desc
   */
  sort?: string;

  /**
   * Determines if the request should return the full cardinality of available
   * options, even if their associated value is null.
   * @default true
   */
  sparse?: boolean;

  /**
   * @example month.latest.6
   * @example Level.oldest
   */
  time?: string;

  /**
   * Slices the resulting items to only the highest/lowest N items by the value
   * of Measure, for all the subgroups signaled by the Level parameters.
   * @example 10.Level.Measure.asc
   * @example 3.Level,Level.Measure.desc
   */
  top?: string;

  /**
   * Calculates the growth in Measure for each Level using one of these methods:
   * - fixed: Calculates growth against a fixed member key from Level
   * - period: Calculates growth comparing a time point with its previous N point
   * @example Level.Measure.fixed.201804
   * @example Level.Measure.period.3
   */
  growth?: string;
}

export interface TesseractDataResponse {
  error?: true;
  detail?: string;
  columns: string[];
  data: DataPoint[];
  page: {
    limit: number;
    offset: number;
    total: number;
  };
}

export interface TesseractMembersRequest {
  cube: string;
  level: string;
  limit?: string;
  locale?: string;
  parents?: boolean;
  search?: string;
}

export interface TesseractMembersResponse {
  /** Name of the relevant level */
  name: string;
  /** Public localized name of the relevant level */
  caption: string;
  dimensionType: DimensionType;
  dimension: string;
  hierarchy: string;
  /** Depth of the level in its Hierarchy */
  depth: number;
  /** Metadata for the level */
  annotations: Annotations;
  /** Child Properties from this level */
  properties: TesseractProperty[];
  /** Data type of each column in the members array */
  dtypes: {[K in keyof TesseractMember]: string};
  /** The actual list of members for the level */
  members: TesseractMember[];
}

export interface TesseractStatus {
  module: string;
  version: string;
  debug: false | Record<string, string>;
  extras: Record<string, string>;
}

export interface TesseractSchema {
  name: string;
  locales: string[];
  default_locale: string;
  annotations: Annotations;
  cubes: TesseractCube[];
}

export interface TesseractCube {
  name: string;
  caption: string;
  annotations: Annotations & {
    /** Dimensions separated by comma */
    available_dimensions?: string;
    /** Measures separated by comma */
    available_measures?: string;
    /** Names of dimensions separated by commas. These dimensions should be hidden by default for drilldown purposes in user-interfaces */
    crosswalk_only_dimensions?: string;
    /** Name of specific data set */
    dataset_name: string;
    /** Link to underlying data */
    dataset_link: string;
    /** Dimensions separated by commas that should not be shown in user-interfaces */
    hidden_dimensions: string;
    /** Measures separated by comma that should not be shown in user-interfaces */
    hidden_measures;
    /** Description of source */
    source_description: string;
    /** Source of data */
    source_name: string;
    /** General link for the source providing the dataset */
    source_link: string;
    /** Subtopic area of dataset (for use in dropdown/variable explorer) */
    subtopic: string;
    /** General topic area of dataset (for use in dropdown/variable explorer) */
    topic: string;
  };
  dimensions: TesseractDimension[];
  measures: TesseractMeasure[];
}

export interface TesseractMeasure {
  name: string;
  caption: string;
  annotations: Annotations & {
    /** Method by which the measure is aggregated */
    aggregation_method?: "COUNT" | "SUM" | "AVERAGE" | "MEDIAN" | "MOE" | "RCA";
    /** Expanded description of a particular Measure */
    details?: string;
    /** Specifies the type of calculated error this measure returns */
    error_type?: "moe" | "lci" | "uci";
    /** Specifies a custom formatter template, hydratable with d3plus-format */
    format_template?: string;
    /** The measure which the RCA calculation uses */
    rca_measure?: string;
    /** Comma separated list of the dimensions which the RCA calculation uses */
    rca_dimensions?: string;
    /** Information on the kind of unit the Measure represents */
    units_of_measurement?:
      | "Growth" // Values will be rendered as [n*100]%.
      | "Percentage" // Values will be rendered as [n]%.
      | "Rate" // Values will be rendered as [n*100]%.
      | "Ratio" // Values will be rendered as [n] to 1.
      | "USD"
      | "Dollars" // Values will be rendered as $[n], without cents.
      | "Thousands of Dollars" // Values are converted to Dollars (n*1000), and are rendered with the Dollars formatter.
      | "Millions of Dollars" // Values are converted to Dollars (n*1e6), and are rendered with the Dollars formatter.
      | "Billions of Dollars" // Values are converted to Dollars (n*1e9), and are rendered with the Dollars formatter.
      | "Years"
      | "People"
      | "Households"
      | "Housing Units"
      | "Occupied Households"
      | "Families"
      | "Deaths"
      | "Index";
  };
  aggregator: Aggregator;
  attached: TesseractMeasure[];
}

export interface TesseractDimension {
  name: string;
  caption: string;
  annotations: Annotations & {
    /** Tells UI elements that this should be treated as the default year dimension */
    default_year?: "true";
    /** The type of the dimension, which lets the vizbuilder do specific things. */
    dim_type?: string;
    /** Boolean to inform whether the user must cut or drilldown on this dimension when using this cube */
    is_required?: "true" | "false";
  };
  type: DimensionType;
  hierarchies: TesseractHierarchy[];
  default_hierarchy: string;
}

export interface TesseractHierarchy {
  name: string;
  caption: string;
  annotations: Annotations;
  levels: TesseractLevel[];
}

export interface TesseractLevel {
  name: string;
  caption: string;
  annotations: Annotations;
  depth: number;
  properties: TesseractProperty[];
}

export interface TesseractProperty {
  name: string;
  caption: string;
  annotations: Annotations;
  type: ColumnType;
}

export interface TesseractMember {
  /** The unique ID for this member */
  key: string | number;
  /** The localized label for this member */
  caption?: string;
  /** A list of direct ancestor members, one per level above this one */
  ancestor?: TesseractMember[];
}

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
