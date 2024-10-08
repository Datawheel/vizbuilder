import type {TranslateFunction} from "@datawheel/use-translation";
import type {TesseractCube, TesseractMeasure} from "./schema";
import type {Column} from "./toolbox/columns";

export type Formatter = (value: number, locale?: string) => string;

export type D3plusConfig = {
  locale?: string;
  [key: string]: unknown;
};

export type ChartType =
  | "barchart"
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

export interface Dataset {
  columns: {[k: string]: Column};
  data: Record<string, unknown>[];
  locale: string;
}
