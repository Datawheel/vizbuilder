import type {TesseractLevel, TesseractMeasure} from "@datawheel/logiclayer-client";
import type {TranslateFunction} from "@datawheel/use-translation";
import {translateFunctionFactory} from "@datawheel/use-translation";
import {identity} from "lodash-es";
import React, {createContext, useContext, useMemo} from "react";
import type {ChartType} from "../charts/common";
import {type Chart, DEFAULT_CHART_LIMITS} from "../charts/generator";
import type {D3plusConfig} from "../d3plus";
import {castArray} from "../toolbox/array";
import type {ChartLimits} from "../types";
import {defaultFormatters, defaultTranslation} from "./defaults";
import type {ErrorContentProps} from "./ErrorBoundary";
import {NonIdealState} from "./NonIdealState";
import {ReportIssueCard} from "./ReportIssue";
import type {ChartBuilderParams} from "./useD3plusConfig";

type Anycase<T extends string> = Uppercase<T> | Lowercase<T>;

export type Formatter = (value: number, locale?: string) => string;

export interface VizbuilderContextValue {
  CardErrorComponent: React.ComponentType<ErrorContentProps>;
  chartLimits: ChartLimits;
  chartTypes: ChartType[];
  datacap: number;
  downloadFormats: ("PNG" | "SVG" | "JPG")[];
  getFormatter: (key: string | TesseractMeasure) => Formatter;
  getTopojsonConfig: (level: TesseractLevel) => Partial<D3plusConfig>;
  NonIdealState: React.ComponentType<{status: "loading" | "empty" | "one-row"}>;
  pagination: boolean;
  postprocessConfig: (
    config: D3plusConfig,
    chart: Chart,
    params: ChartBuilderParams,
  ) => D3plusConfig | false;
  showConfidenceInt: boolean;
  suggestedWidth: number;
  translate: TranslateFunction;
  ViewErrorComponent: React.ComponentType<ErrorContentProps>;
}

const defaults: VizbuilderContextValue = {
  CardErrorComponent: ReportIssueCard,
  chartLimits: DEFAULT_CHART_LIMITS,
  chartTypes: ["barchart", "choropleth", "donut", "lineplot", "stackedarea", "treemap"],
  datacap: 20000,
  downloadFormats: ["SVG", "PNG"],
  getFormatter: key => {
    if (typeof key === "string") {
      return defaultFormatters[key] || defaultFormatters.identity;
    }
    const {format_template, units_of_measurement} = key.annotations || {};
    const name = format_template || units_of_measurement || "";
    return (
      defaultFormatters[name] || defaultFormatters[key.name] || defaultFormatters.identity
    );
  },
  getTopojsonConfig: () => ({}),
  NonIdealState: NonIdealState,
  pagination: false,
  postprocessConfig: identity,
  showConfidenceInt: false,
  suggestedWidth: 500,
  translate: translateFunctionFactory(defaultTranslation),
  ViewErrorComponent: () => null,
};

const VizbuilderContext = createContext(defaults);

export type VizbuilderProviderProps = React.ComponentProps<typeof VizbuilderProvider>;

export function VizbuilderProvider(props: {
  /**
   * Defines a set of rules about the validity/usefulness of the generated charts.
   * Charts which not comply with them are discarded.
   *
   * @see {@link ChartLimits} for details on its properties.
   */
  chartLimits?: Partial<ChartLimits>;

  /**
   * A list of the chart types the algorithm will generate.
   *
   * @default ["barchart", "choropleth", "donut", "lineplot", "stackedarea", "treemap"]
   */
  chartTypes?: ChartType[];

  /**
   * Children element to be wrapped by this Provider.
   */
  children?: React.ReactNode;

  /**
   * Defines a maximum amount of records to consider when analyzing the data.
   * To disable it, set it to `Infinite`.
   *
   * @default 20000
   */
  datacap?: number;

  /**
   * A list of extension formats to make available to download charts as.
   *
   * @default ["SVG", "PNG"]
   */
  downloadFormats?: Anycase<"SVG" | "PNG" | "JPG">[];

  /**
   * Specifies a component to render instead of the content in case an Error
   * inside a ChartCard can't be recovered.
   */
  CardErrorComponent?: React.ComponentType<ErrorContentProps>;

  /**
   * Specifies a component to render instead of the content in case an Error
   * inside the general app can't be recovered.
   */
  ViewErrorComponent?: React.ComponentType<ErrorContentProps>;

  /**
   * Defines a custom component to show in case no valid/useful charts can be
   * generated from the provided parameters.
   */
  NonIdealState?: React.ComponentType<{status: "loading" | "empty" | "one-row"}>;

  /**
   * Function to access the available value Formatters.
   * Given the Formatter name or associated TesseractMeasure object, this
   * function should return the Formatter function to apply format to a value.
   */
  getFormatter?: (key: string | TesseractMeasure) => Formatter;

  /**
   * Specifies if the grid view should use pagination to limit the amount of charts
   * being rendered at the same time. This disables the scrolling and calculates
   * the amount of charts per page based on the suggestedWidth.
   */
  pagination?: boolean;

  /**
   * Custom d3plus configuration to apply to all generated charts.
   * Unlike measureConfig and topojsonConfig, this is applied after all other
   * chart configs have been resolved, so is able to overwrite everything.
   */
  postprocessConfig?: (
    config: D3plusConfig,
    chart: Chart,
    params: ChartBuilderParams,
  ) => D3plusConfig | false;

  /**
   * Determines if the charts will use associated measures to show confidence
   * intervals or margins of error.
   *
   * @default false
   */
  showConfidenceInt?: boolean;

  /**
   * Specifies a width the charts should be rendered with on the grid view with
   * pagination active. The final size will vary ~15%.
   *
   * @default 500
   */
  suggestedWidth?: number;

  /**
   * Custom d3plus configuration to apply when a chart series references a
   * specified Geographic dimension level.
   * Use this to provide the [`topojson`](https://d3plus.org/?path=/docs/charts-choropleth-map--documentation) field to these charts, otherwise they
   * will be discarded.
   */
  topojsonConfig?:
    | {[K: string]: Partial<D3plusConfig>}
    | ((level: TesseractLevel) => Partial<D3plusConfig>);

  /**
   * A function to interpolate the applicaiton strings into sentences in the
   * correct language for the user.
   */
  translate?: TranslateFunction;
}) {
  const chartTypes = castArray(props.chartTypes || defaults.chartTypes).join(",");

  const downloadFormats = castArray(
    props.downloadFormats || defaults.downloadFormats,
  ).join(",");

  const topojsonConfig = props.topojsonConfig || defaults.getTopojsonConfig;

  const postprocessConfig = props.postprocessConfig || defaults.postprocessConfig;

  const value = useMemo<VizbuilderContextValue>(() => {
    return {
      CardErrorComponent: props.CardErrorComponent || defaults.CardErrorComponent,
      chartLimits: {...defaults.chartLimits, ...props.chartLimits},
      chartTypes: chartTypes.split(",") as ChartType[],
      datacap: props.datacap || defaults.datacap,
      downloadFormats: downloadFormats.split(",") as ("SVG" | "PNG" | "JPG")[],
      getFormatter: props.getFormatter || defaults.getFormatter,
      getTopojsonConfig:
        typeof topojsonConfig === "function"
          ? topojsonConfig
          : item => topojsonConfig[item.name],
      NonIdealState: props.NonIdealState || defaults.NonIdealState,
      pagination: props.pagination || defaults.pagination,
      postprocessConfig: postprocessConfig,
      showConfidenceInt: props.showConfidenceInt || defaults.showConfidenceInt,
      suggestedWidth: props.suggestedWidth || defaults.suggestedWidth,
      translate: props.translate || defaults.translate,
      ViewErrorComponent: props.ViewErrorComponent || defaults.ViewErrorComponent,
    };
  }, [
    chartTypes,
    downloadFormats,
    postprocessConfig,
    props.CardErrorComponent,
    props.chartLimits,
    props.datacap,
    props.getFormatter,
    props.NonIdealState,
    props.pagination,
    props.showConfidenceInt,
    props.suggestedWidth,
    props.translate,
    props.ViewErrorComponent,
    topojsonConfig,
  ]);

  return (
    <VizbuilderContext.Provider value={value}>
      {props.children}
    </VizbuilderContext.Provider>
  );
}

export function useVizbuilderContext(): VizbuilderContextValue {
  return useContext(VizbuilderContext);
}
