import React, {createContext, useContext, useMemo} from "react";
import type {ChartType} from "../charts/common";
import {type Chart, DEFAULT_CHART_LIMITS} from "../charts/generator";
import type {D3plusConfig} from "../d3plus";
import type {TesseractLevel, TesseractMeasure} from "../schema";
import {castArray} from "../toolbox/array";
import type {ChartLimits} from "../types";
import {ErrorBoundary} from "./ErrorBoundary";
import {type Formatter, defaultFormatters} from "./FormatterProvider";
import { NonIdealState } from "./NonIdealState";
import type {ChartBuilderParams} from "./useD3plusConfig";

type Anycase<T extends string> = Uppercase<T> | Lowercase<T>;

export interface VizbuilderContextValue {
  chartLimits: ChartLimits;
  chartTypes: ChartType[];
  datacap: number;
  downloadFormats: ("PNG" | "SVG" | "JPG")[];
  ErrorBoundary: React.ComponentType<{children: React.ReactNode}>;
  NonIdealState: React.ComponentType;
  getFormatter: (key: string | TesseractMeasure) => Formatter;
  getMeasureConfig: (measure: TesseractMeasure) => Partial<D3plusConfig>;
  getTopojsonConfig: (level: TesseractLevel) => Partial<D3plusConfig>;
  postprocessConfig: (
    config: Partial<D3plusConfig>,
    chart: Chart,
    params: ChartBuilderParams,
  ) => Partial<D3plusConfig>;
  showConfidenceInt: boolean;
  translationNamespace: string;
}

const defaults: VizbuilderContextValue = {
  chartLimits: DEFAULT_CHART_LIMITS,
  chartTypes: ["barchart", "choropleth", "donut", "lineplot", "stackedarea", "treemap"],
  datacap: 20000,
  downloadFormats: ["SVG", "PNG"],
  ErrorBoundary: ErrorBoundary,
  NonIdealState: NonIdealState,
  showConfidenceInt: false,
  translationNamespace: "",
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
  getMeasureConfig: () => ({}),
  getTopojsonConfig: () => ({}),
  postprocessConfig: config => config,
};

const VizbuilderContext = createContext(defaults);

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
   * Determines if the charts will use associated measures to show confidence
   * intervals or margins of error.
   *
   * @default false
   */
  showConfidenceInt?: boolean;

  /**
   * Defines a path namespace for the translation keys to be used by the package.
   */
  translationNamespace?: string;

  /**
   * Defines a custom Error Boundary component around ChartCards.
   */
  ErrorBoundary?: React.ComponentType<{children: React.ReactNode}>;

  /**
   * Defines a custom component to show in case no valid/useful charts can be
   * generated from the provided parameters.
   */
  NonIdealState?: React.ComponentType<any>;

  /**
   * Function to access the available value Formatters.
   * Given the Formatter name or associated TesseractMeasure object, this
   * function should return the Formatter function to apply format to a value.
   */
  getFormatter?: (key: string | TesseractMeasure) => Formatter;

  /**
   * Custom d3plus configuration to apply when a chart value references a
   * specified measures.
   */
  measureConfig?:
    | {[K: string]: Partial<D3plusConfig>}
    | ((measure: TesseractMeasure) => Partial<D3plusConfig>);

  /**
   * Custom d3plus configuration to apply to all generated charts.
   * Unlike measureConfig and topojsonConfig, this is applied after all other
   * chart configs have been resolved, so is able to overwrite everything.
   */
  postprocessConfig?: (
    config: Partial<D3plusConfig>,
    chart: Chart,
    params: ChartBuilderParams,
  ) => Partial<D3plusConfig>;

  /**
   * Custom d3plus configuration to apply when a chart series references a
   * specified Geographic dimension level.
   * Use this to provide the [`topojson`](https://d3plus.org/?path=/docs/charts-choropleth-map--documentation) field to these charts, otherwise they
   * will be discarded.
   */
  topojsonConfig?:
    | {[K: string]: Partial<D3plusConfig>}
    | ((level: TesseractLevel) => Partial<D3plusConfig>);
}) {
  const chartTypes = castArray(props.chartTypes || defaults.chartTypes).join(",");

  const downloadFormats = castArray(
    props.downloadFormats || defaults.downloadFormats,
  ).join(",");

  const measureConfig = props.measureConfig || defaults.getMeasureConfig;

  const topojsonConfig = props.topojsonConfig || defaults.getTopojsonConfig;

  const postprocessConfig = props.postprocessConfig || defaults.postprocessConfig;

  const value = useMemo<VizbuilderContextValue>(() => {
    return {
      chartLimits: {...defaults.chartLimits, ...props.chartLimits},
      chartTypes: chartTypes.split(",") as ChartType[],
      datacap: props.datacap || defaults.datacap,
      downloadFormats: downloadFormats.split(",") as ("SVG" | "PNG" | "JPG")[],
      showConfidenceInt: props.showConfidenceInt || defaults.showConfidenceInt,
      translationNamespace: props.translationNamespace || defaults.translationNamespace,
      ErrorBoundary: props.ErrorBoundary || defaults.ErrorBoundary,
      NonIdealState: props.NonIdealState || defaults.NonIdealState,
      getFormatter: props.getFormatter || defaults.getFormatter,
      getMeasureConfig:
        typeof measureConfig === "function"
          ? measureConfig
          : item => measureConfig[item.name],
      getTopojsonConfig:
        typeof topojsonConfig === "function"
          ? topojsonConfig
          : item => topojsonConfig[item.name],
      postprocessConfig: postprocessConfig,
    };
  }, [
    chartTypes,
    downloadFormats,
    measureConfig,
    postprocessConfig,
    props.chartLimits,
    props.datacap,
    props.ErrorBoundary,
    props.NonIdealState,
    props.getFormatter,
    props.showConfidenceInt,
    props.translationNamespace,
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
