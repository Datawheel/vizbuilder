export interface ChartLimits {
  /** Maximum number of bars in barchart */
  BARCHART_MAX_BARS: number;
  /** Maximum number of series stacked in the single bar */
  BARCHART_MAX_STACKED_BARS: number;
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

/**
 * Parameters for determining the constraints and limits of certain chart types
 */
export const DEFAULT_CHART_LIMITS: ChartLimits = {
  BARCHART_MAX_BARS: 20,
  BARCHART_MAX_STACKED_BARS: 10,
  BARCHART_YEAR_MAX_BARS: 20,
  DONUT_SHAPE_MAX: 30,
  LINEPLOT_LINE_POINT_MIN: 2,
  LINEPLOT_LINE_MAX: 20,
  STACKED_SHAPE_MAX: 200,
  STACKED_TIME_MEMBER_MIN: 2,
  TREE_MAP_SHAPE_MAX: 1000,
};

export const DEFAULT_DATACAP = 2e4;
