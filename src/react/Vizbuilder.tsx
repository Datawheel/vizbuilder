import {Modal, SimpleGrid} from "@mantine/core";
import cls from "clsx";
import React, {useCallback, useMemo, useState} from "react";
import {type Chart, type ChartType, generateCharts} from "../charts";
import {castArray} from "../toolbox/array";
import type {
  ChartLimits,
  D3plusConfig,
  Dataset,
  TesseractLevel,
  TesseractMeasure,
} from "../types";
import {ChartCard} from "./ChartCard";
import {NonIdealState} from "./NonIdealState";

export type VizbuilderProps = React.ComponentProps<typeof Vizbuilder>;

/** */
export function Vizbuilder(props: {
  /**
   * The datasets to extract the charts from.
   */
  datasets: Dataset | Dataset[];

  /**
   * Defines a set of rules about the validity/usefulness of the generated charts.
   * Charts which not comply with them are discarded.
   *
   * @see {@link ChartLimits} for details on its properties.
   */
  chartLimits?: ChartLimits;

  /**
   * A list of the chart types the algorithm will generate.
   *
   * @default ["barchart", "choropleth", "donut", "lineplot", "stackedarea", "treemap"]
   */
  chartTypes?: ChartType[];

  /**
   * Custom className to apply to the component wrapper.
   *
   * @default
   */
  className?: string;

  /**
   * A ReactNode to render above the main charts area.
   *
   * @default undefined
   */
  customHeader?: React.ReactNode;

  /**
   * A ReactNode to render under the main charts area.
   *
   * @default undefined
   */
  customFooter?: React.ReactNode;

  /**
   * Defines a maximum amount of records to consider when analyzing the data.
   *
   * @default 20000
   */
  datacap?: number;

  /**
   * A list of extension formats to make available to download charts as.
   *
   * @default ["SVG", "PNG"]
   */
  downloadFormats?: ("PNG" | "SVG" | "JPG")[];

  /**
   * Custom d3plus configuration to apply when a chart value references a
   * specified measures.
   */
  measureConfig?:
    | {[K: string]: Partial<D3plusConfig>}
    | ((measure: TesseractMeasure) => Partial<D3plusConfig>);

  /**
   * A component to show in case no valid/useful charts can be generated from the datasets.
   */
  nonIdealState?: React.ComponentType;

  /**
   * Determines if the charts will use associated measures to show confidence
   * intervals or margins of error.
   *
   * @default false
   */
  showConfidenceInt?: boolean;

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
   * Custom d3plus configuration to apply to all generated charts.
   * Unlike measureConfig and topojsonConfig, this is applied after all other
   * chart configs have been resolved, so is able to overwrite everything.
   */
  userConfig?: (chart: Chart) => Partial<D3plusConfig>;
}) {
  const {
    datasets,
    chartLimits,
    chartTypes,
    datacap,
    downloadFormats,
    measureConfig,
    nonIdealState,
    showConfidenceInt,
    topojsonConfig,
    userConfig,
  } = props;

  const [currentChart, setCurrentChart] = useState("");

  // Normalize measureConfig to function type
  const getMeasureConfig = useMemo(() => {
    const config = measureConfig || {};
    return typeof config === "function" ? config : item => config[item.name];
  }, [measureConfig]);

  // Normalize topojsonConfig to function type
  const getTopojsonConfig = useMemo(() => {
    const config = topojsonConfig || {};
    return typeof config === "function" ? config : item => config[item.name];
  }, [topojsonConfig]);

  // Compute possible charts
  const charts = useMemo(() => {
    const charts = generateCharts(castArray(datasets), {
      chartLimits,
      chartTypes,
      datacap,
      getTopojsonConfig,
    });
    return Object.fromEntries(charts.map(chart => [chart.key, chart]));
  }, [chartLimits, chartTypes, datacap, datasets, getTopojsonConfig]);

  const content = useMemo(() => {
    const chartList = Object.values(charts);

    if (chartList.length === 0) {
      const Notice = nonIdealState || NonIdealState;
      return <Notice />;
    }

    const isSingleChart = chartList.length === 1;

    return (
      <SimpleGrid
        breakpoints={[
          {minWidth: "xs", cols: 1},
          {minWidth: "md", cols: 2},
          {minWidth: "lg", cols: 3},
          {minWidth: "xl", cols: 4},
        ]}
        className={cls({unique: isSingleChart})}
      >
        {chartList.map(chart => (
          <ChartCard
            key={chart.key}
            chart={chart}
            downloadFormats={downloadFormats}
            measureConfig={getMeasureConfig}
            onFocus={() => setCurrentChart(chart.key)}
            showConfidenceInt={showConfidenceInt}
            userConfig={userConfig}
          />
        ))}
      </SimpleGrid>
    );
  }, [
    charts,
    getMeasureConfig,
    nonIdealState,
    downloadFormats,
    userConfig,
    showConfidenceInt,
  ]);

  const focusContent = useMemo(() => {
    const chart = charts[currentChart];

    if (!chart) return null;

    return (
      <ChartCard
        key={`${chart.key}-focus`}
        chart={chart}
        downloadFormats={downloadFormats}
        measureConfig={getMeasureConfig}
        onFocus={() => setCurrentChart("")}
        showConfidenceInt={showConfidenceInt}
        userConfig={userConfig}
        isFullMode
      />
    );
  }, [
    charts,
    currentChart,
    downloadFormats,
    getMeasureConfig,
    showConfidenceInt,
    userConfig,
  ]);

  return (
    <div className={cls("vb-wrapper", props.className)}>
      {props.customHeader}
      {content}
      {props.customFooter}
      <Modal
        centered
        onClose={useCallback(() => setCurrentChart(""), [])}
        opened={currentChart !== ""}
        padding={0}
        size="calc(100vw - 3rem)"
        styles={{
          content: {maxHeight: "none !important"},
          inner: {padding: "0 !important"},
        }}
        withCloseButton={false}
      >
        {focusContent}
      </Modal>
    </div>
  );
}
