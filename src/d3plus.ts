import type {CSSProperties} from "react";
import type {DataPoint} from "./schema";

interface AxisConfig {
  barConfig?: Record<string, string | number>;
  gridConfig?: Record<string, string | number>;
  label?: string;
  labelOffset?: false | number;
  maxSize?: number;
  scale?: AxisScale;
  tickFormat?: (d: number | string) => string | number; // Custom tick formatting function
  tickSize?: number;
  title?: string;
}

type AxisScale =
  | "auto"
  | "band"
  | "diverging"
  | "divergingLog"
  | "divergingPow"
  | "divergingSqrt"
  | "divergingSymlog"
  | "identity"
  | "implicit"
  | "jenks"
  | "linear"
  | "log"
  | "ordinal"
  | "point"
  | "pow"
  | "quantile"
  | "quantize"
  | "radial"
  | "sequential"
  | "sequentialLog"
  | "sequentialPow"
  | "sequentialQuantile"
  | "sequentialSqrt"
  | "sequentialSymlog"
  | "sqrt"
  | "symlog"
  | "threshold"
  | "time"
  | "utc";

type Position = "top" | "right" | "bottom" | "left";

type DataPointAccessor<T> = string | ((d: DataPoint) => T);

export type D3plusConfig<P extends DataPoint = DataPoint> = {
  data: P[] | string;
  locale: string;

  aggs?: Record<keyof P, (d: P[keyof P]) => number | string>;
  barPadding?: number; // Padding between bars
  colorScale?: string | ((d: number) => string); // Color scale or custom color function
  colorScaleConfig?: {
    axisConfig?: AxisConfig;
    scale?: AxisScale;
  };
  colorScalePosition?: false | Position;
  discrete?: "x" | "y"; // Sets orientation of main category series
  /** Optional grouping key */
  groupBy?:
    | string
    | string[]
    | ((d: DataPoint) => string | number)
    | ((d: DataPoint) => string | number)[];
  label?: string | ((d: DataPoint) => string);
  legend?: boolean;
  legendConfig?: {
    label?: DataPointAccessor<string>;
    shapeConfig?: Record<string, string | number>;
  };
  legendPosition?: Position;
  loadingMessage?: boolean;
  loadingHTML?: string; // innerHTML to write in the loading pin
  on?: Record<string, (event: Event) => void>;
  stacked?: boolean;
  stackOrder?: string[];
  threshold?: number;
  thresholdName?: string;
  time?: string;
  title?: string | (() => string); // Optional title for the chart
  titleConfig?: CSSProperties;
  tooltip?: boolean; // Tooltip configuration or custom function
  tooltipConfig?: {
    title?: (d: DataPoint) => string;
    body?: (d: DataPoint) => string;
    thead?: (d: DataPoint) => [string, string][];
    tbody?: (d: DataPoint) => [string, string][];
  };
  shapeConfig?: Record<string, string | number>;
  /** Value accessor for treemaps */
  sum?: DataPointAccessor<number>;
  value?: DataPointAccessor<number>;
  x?: string; // Key for the x-axis values
  xConfig?: AxisConfig;
  y?: string; // Key for the y-axis values
  yConfig?: AxisConfig;

  depth?: number;
  /** Allows removing specific geographies from topojson file to improve zooming determination. */
  fitFilter?:
    | number
    | string
    | ((d: {
        id?: string;
        geometry: {type: string; coordinates: unknown[]};
        properties: Record<string, string>;
        type: string;
      }) => boolean);
  /** Ocean color, can be any CSS value including 'transparent' */
  ocean?: string;
  /** Map projection used when displaying topojson and coordinate points */
  projection?: string | ((x: number, y: number) => [number, number]);
  /** Outer padding between the edge of the visualization and the shapes drawn */
  projectionPadding?: number | string;
  /** Used to shift the centerpoint of a map */
  projectionRotate?: [number, number];
  /** URL to the XYZ map tiles to use */
  tileUrl?: string;
  /** Toggles the visibility of the map tiles */
  tiles?: boolean;
  /** Path to the Topojson file to use */
  topojson?: string;
  /** CSS color to fill the map shapes */
  topojsonFill?: string;
  topojsonId?: string;
  zoom?: false;

  [key: string]: unknown;
};
