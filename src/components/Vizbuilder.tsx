import {Modal, SimpleGrid} from "@mantine/core";
import cls from "clsx";
import React, {useMemo, useState} from "react";
import type {ChartLimits} from "../constants";
import type {TesseractLevel, TesseractMeasure} from "../schema";
import type {ChartType, D3plusConfig, Dataset} from "../structs";
import {castArray} from "../toolbox/array";
import {generateCharts, normalizeAccessor} from "../toolbox/generateCharts";
import {ChartCard} from "./ChartCard";
import {NonIdealState} from "./NonIdealState";

interface VizbuilderConfig {
  chartLimits: ChartLimits;
  chartTypes: ChartType[];
  datacap: number;
  locale: string;
  measureConfig:
    | Record<string, D3plusConfig>
    | ((measure: TesseractMeasure) => D3plusConfig);
  showConfidenceInt: boolean;
  topojsonConfig:
    | Record<string, D3plusConfig>
    | ((level: TesseractLevel) => D3plusConfig);
  userConfig: D3plusConfig;
}

export interface VizbuilderProps extends Partial<VizbuilderConfig> {
  className?: string;
  downloadFormats?: string[];
  nonIdealState?: React.ComponentType;
  datasets: Dataset | Dataset[];
  toolbar?: React.ReactNode;
}

/** */
export function Vizbuilder(props: VizbuilderProps) {
  const [currentChart, setCurrentChart] = useState("");

  const getMeasureConfig = useMemo(
    () => normalizeAccessor(props.measureConfig || {}),
    [props.measureConfig],
  );

  const charts = useMemo(
    () =>
      generateCharts(castArray(props.datasets), {
        chartLimits: props.chartLimits,
        chartTypes: props.chartTypes,
        datacap: props.datacap,
        topojsonConfig: props.topojsonConfig,
      }),
    [props.datasets],
  );

  const content = useMemo(() => {
    const isSingleChart = charts.length === 1;
    const chartMap = new Map(charts.map(item => [item.key, item]));
    const filteredCharts = [...chartMap.values()];

    if (filteredCharts.length === 0) return;

    return (
      <SimpleGrid
        breakpoints={[
          {minWidth: "xs", cols: 1},
          {minWidth: "md", cols: 2},
          {minWidth: "lg", cols: 3},
          {minWidth: "xl", cols: 4},
        ]}
        className={cls({unique: filteredCharts.length === 1})}
      >
        {filteredCharts.map(chart => (
          <ChartCard
            chart={chart}
            currentChart={""}
            downloadFormats={props.downloadFormats}
            isSingleChart={isSingleChart}
            key={chart.key}
            measureConfig={getMeasureConfig}
            onToggle={() => setCurrentChart(chart.key)}
            showConfidenceInt={props.showConfidenceInt}
            userConfig={props.userConfig}
          />
        ))}
      </SimpleGrid>
    );
  }, [currentChart, charts, props.showConfidenceInt]);

  const focusContent = useMemo(() => {
    const chart = charts.find(chart => currentChart && chart.key === currentChart);
    if (!chart) return null;

    return (
      <ChartCard
        chart={chart}
        currentChart={currentChart}
        downloadFormats={props.downloadFormats}
        isSingleChart={true}
        key={`${chart.key}-focus`}
        measureConfig={getMeasureConfig}
        onToggle={() => setCurrentChart("")}
        showConfidenceInt={props.showConfidenceInt}
        userConfig={props.userConfig}
      />
    );
  }, [currentChart, charts, props.showConfidenceInt]);

  const Notice = props.nonIdealState || NonIdealState;

  return (
    <div className={cls("vb-wrapper", props.className)}>
      {props.toolbar && <div className="vb-toolbar-wrapper">{props.toolbar}</div>}
      {content || <Notice />}
      <Modal
        centered
        onClose={() => setCurrentChart("")}
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
