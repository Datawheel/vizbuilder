import type {TranslateFunction} from "@datawheel/use-translation";
import type {TesseractCube, TesseractMeasure} from "./schema";

export type Formatter = (value: number, locale?: string) => string;

export type D3plusConfig = {
  locale?: string;
  [key: string]: unknown;
};

export type ChartType =
  | "barchart"
  | "barchartyear"
  | "donut"
  | "geomap"
  | "histogram"
  | "lineplot"
  | "pie"
  | "stacked"
  | "treemap";

export interface UIParams {
  currentChart: string;
  isSingleChart: boolean;
  isUniqueChart: boolean;
  measureConfig: (measure: TesseractMeasure) => D3plusConfig;
  showConfidenceInt: boolean;
  translate: TranslateFunction;
  userConfig: D3plusConfig;
}

export interface QueryResult {
  cube: TesseractCube;
  dataset: Record<string, unknown>[];
  params: QueryParams;
}

export interface QueryParams {
  key: string;
  cube: string;
  cuts: CutItem[];
  drilldowns: DrilldownItem[];
  filters: FilterItem[];
  locale: string;
  measures: MeasureItem[];
}

export interface MeasureColumn {
  type: "measure";
  measure: string;
  filter: FilterConstraint[];
  source?: string;
  collection?: string;
  moe?: string;
  lci?: string;
  uci?: string;
}

export interface LevelColumn {
  type: "level";
  dimension: string;
  hierarchy: string;
  level: string;
  members: {key: string; caption?: string}[];
  include: string[];
  exclude: string[];
}

export interface PropertyColumn {
  type: "property";
  dimension: string;
  hierarchy: string;
  level: string;
  property: string;
}

export type Column = MeasureColumn | LevelColumn | PropertyColumn;

export interface MeasureSet {
  /** The measure set directly by the user. */
  measure: TesseractMeasure;

  /** A formatting function to display values. */
  formatter: Formatter;

  /** */
  collection: TesseractMeasure | undefined;

  /** */
  source: TesseractMeasure | undefined;

  /** Margin of Error measure for the current measure. */
  moe?: TesseractMeasure;

  /** The Lower Confidence Interval measure for the current measure. */
  lci?: TesseractMeasure;

  /** The Upper Confidence Interval measure for the current measure. */
  uci?: TesseractMeasure;
}
