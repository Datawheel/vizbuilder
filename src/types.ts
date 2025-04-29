import type {TranslateFunction} from "@datawheel/use-translation";
import type {D3plusConfig} from "./d3plus";
import type {DataPoint, TesseractMeasure} from "./schema";
import type {Column} from "./toolbox/columns";

/**
 * Parameters for determining the constraints and limits of certain chart types
 */
export interface ChartLimits {
  /** Maximum number of bars in barchart */
  BARCHART_MAX_BARS: number;
  /** Maximum number of series stacked in the single bar */
  BARCHART_MAX_STACKED_BARS: number;
  /** Maximum number of primary dimensions to show in vertical barcharts */
  BARCHART_VERTICAL_MAX_GROUPS: number;
  /** Maximum number of bars in a year barchart */
  BARCHART_YEAR_MAX_BARS: number;
  /** Max number of groups to be rendered in a donut or pie chart */
  DONUT_SHAPE_MAX: number;
  /** Minimum number of data points in groupto render a line in lineplot */
  LINEPLOT_LINE_POINT_MIN: number;
  /** Max number of lines to render in lineplot */
  LINEPLOT_LINE_MAX: number;
  /** Max shapes to render in stacked chart */
  STACKED_SHAPE_MAX: number;
  /** Min number of data members in the time dimension (e.g. number of years) required to render stacked area chart */
  STACKED_TIME_MEMBER_MIN: number;
  /** Max number of shapes to render in tree map */
  TREE_MAP_SHAPE_MAX: number;
}

export interface Dataset {
  columns: {[k: string]: Column};
  data: DataPoint[];
  locale: string;
}

export interface UIParams {
  currentChart: string;
  isSingleChart: boolean;
  isUniqueChart: boolean;
  measureConfig: (measure: TesseractMeasure) => Partial<D3plusConfig>;
  showConfidenceInt: boolean;
  translate: TranslateFunction;
  userConfig: Partial<D3plusConfig>;
}
