import type {TranslateFunction} from "@datawheel/use-translation";
import type {D3plusConfig} from "./d3plus";
import type {DataPoint, TesseractMeasure} from "./schema";
import type {Column} from "./toolbox/columns";

export interface UIParams {
  currentChart: string;
  isSingleChart: boolean;
  isUniqueChart: boolean;
  measureConfig: (measure: TesseractMeasure) => Partial<D3plusConfig>;
  showConfidenceInt: boolean;
  translate: TranslateFunction;
  userConfig: Partial<D3plusConfig>;
}

export interface Dataset {
  columns: {[k: string]: Column};
  data: DataPoint[];
  locale: string;
}
