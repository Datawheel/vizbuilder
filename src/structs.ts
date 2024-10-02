import type {TranslateFunction} from "@datawheel/use-translation";
import type {Comparison, TesseractCube, TesseractMeasure} from "./schema";

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

export interface CutItem {
  dimension?: string;
  hierarchy?: string;
  level: string;
  members: string[];
  exclude?: boolean;
}

export interface DrilldownItem {
  dimension?: string;
  hierarchy?: string;
  level: string;
  properties?: string[];
  caption?: string;
}

export interface FilterItem {
  measure: string;
  constraint1: [Comparison, number];
  constraint2?: [Comparison, number];
  formatter?: Formatter;
  joint?: "and" | "or" | undefined;
}

export interface MeasureItem {
  collection?: string;
  formatter?: Formatter;
  lci?: string;
  measure: string;
  moe?: string;
  source?: string;
  uci?: string;
}

export interface FilterSet {
  /** The measure set directly by the user. */
  measure: TesseractMeasure;

  /** A formatting function to display values. */
  formatter: Formatter;

  /** Main constraint for the filter */
  constraint1: [Comparison, number];

  /** Additional constraint for the filter, associated to the same measure. */
  constraint2?: [Comparison, number];

  /** The joint condition for the constraints, only valid when both are defined. */
  joint?: "and" | "or";
}

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
