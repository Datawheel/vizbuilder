import {Group, Select, SimpleGrid, Switch} from "@mantine/core";
import {useDisclosure, useLocalStorage} from "@mantine/hooks";
import cls from "clsx";
import React, {useEffect, useMemo, useState} from "react";
import {ObjectInspector} from "react-inspector";
import type {VizbuilderProps} from "../src";
import {D3plusBarchart} from "../src/components/Barchart";
import {ChartCard} from "../src/components/ChartCard";
import {D3plusChoropleth} from "../src/components/Geomap";
import {D3plusLineplot} from "../src/components/Lineplot";
import { D3plusTreemap } from "../src/components/Treemap";
import {castArray} from "../src/toolbox/array";
import {
  type Chart,
  type ChartType,
  generateCharts,
  normalizeAccessor,
} from "../src/toolbox/generateCharts";

const components: Record<
  ChartType,
  React.ComponentType<{config: Chart; fullMode: boolean}>
> = {
  barchart: D3plusBarchart,
  choropleth: D3plusChoropleth,
  lineplot: D3plusLineplot,
  treemap: D3plusTreemap,
};

export function Vizdebugger(props: VizbuilderProps) {
  const {chartLimits, chartTypes, datacap, datasets, topojsonConfig} = props;

  const charts = useMemo(() => {
    const options = {chartLimits, chartTypes, datacap, topojsonConfig};
    const charts = generateCharts(castArray(datasets), options);
    return Object.fromEntries(charts.map(chart => [chart.key, chart]));
  }, [datasets, chartLimits, chartTypes, datacap, topojsonConfig]);

  const [chartKey, setChartKey] = useLocalStorage({
    key: "Vizdebugger:chartKey",
    getInitialValueInEffect: false,
    defaultValue: Object.keys(charts)[0] || "",
  });
  const [fullMode, setFullMode] = useDisclosure(true);

  const chartConfig = charts[chartKey];
  const ChartComponent = chartConfig && components[chartConfig.type];

  return (
    <SimpleGrid cols={2}>
      <div>
        <Group grow>
          <Select data={Object.keys(charts)} value={chartKey} onChange={setChartKey} />
          <Switch label="Full mode" checked={fullMode} onChange={setFullMode.toggle} />
        </Group>
        {chartConfig && ChartComponent && (
          <ChartComponent config={chartConfig} fullMode={fullMode} />
        )}
      </div>
      <div>
        <ObjectInspector data={props} expandLevel={1} />
        <ObjectInspector data={charts} expandLevel={2} />
      </div>
    </SimpleGrid>
  );
}

export function VizdebuggerOG(props: VizbuilderProps) {
  const {chartLimits, chartTypes} = props;

  const [currentChart, setCurrentChart] = useState("");
  const [isUniqueChart, setUniqueChart] = useState(false);
  const [isSingleChart, setSingleChart] = useState(false);

  const charts = useMemo(
    () =>
      generateCharts(castArray(props.datasets), {
        chartLimits: chartLimits,
        chartTypes: chartTypes,
        datacap: props.datacap,
        topojsonConfig: props.topojsonConfig,
      }),
    [props.datasets, chartLimits, chartTypes, props.datacap, props.topojsonConfig],
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies:
  useEffect(() => {
    if (charts.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const chart = params.get("chart") || currentChart || charts[0].key;
      setCurrentChart(chart);
    }
  }, []);

  useEffect(() => {
    if (currentChart) {
      const params = new URLSearchParams({chart: `${currentChart}`});
      const nextLocation = `${window.location.pathname}?${params}`;
      window.history.replaceState(currentChart, "", nextLocation);
    }
  }, [currentChart]);

  const chartIndex = charts.findIndex(chart => chart.key === currentChart);

  const content = useMemo(() => {
    if (charts.length === 0) {
      return <div>No charts outputted.</div>;
    }
    const chart = charts[chartIndex];
    if (!chart) {
      return <div>Chart with key {currentChart} not found.</div>;
    }
    const measureConfig = normalizeAccessor(props.measureConfig || {});

    return (
      <ChartCard
        chart={chart}
        currentChart={isSingleChart || isUniqueChart ? currentChart : ""}
        downloadFormats={props.downloadFormats}
        isSingleChart={isSingleChart}
        key={chart.key}
        measureConfig={measureConfig}
        onToggle={() => null}
        showConfidenceInt={props.showConfidenceInt || false}
        userConfig={props.userConfig || {}}
      />
    );
  }, [
    charts,
    chartIndex,
    currentChart,
    props.downloadFormats,
    props.measureConfig,
    props.userConfig,
    isSingleChart,
    isUniqueChart,
    props.showConfidenceInt,
  ]);

  return (
    <div className={cls("vb-wrapper debugger", props.className)}>
      <div className="vb-toolbar-wrapper">
        {props.toolbar}
        <button
          type="button"
          onClick={() => setCurrentChart(charts[Math.max(0, chartIndex - 1)].key)}
        >
          Prev
        </button>
        <span>{currentChart}</span>
        <button
          type="button"
          onClick={() =>
            setCurrentChart(charts[Math.min(chartIndex + 1, charts.length - 1)].key)
          }
        >
          Next
        </button>
        <label>
          <input type="checkbox" onChange={() => setUniqueChart(!isUniqueChart)} />
          <span>Unique</span>
        </label>
        <label>
          <input type="checkbox" onChange={() => setSingleChart(!isSingleChart)} />
          <span>Single</span>
        </label>
      </div>
      <div className="vb-charts-wrapper unique">{content}</div>
      <div className="vb-props-wrapper">
        <ObjectInspector data={props.datasets} />
        <ObjectInspector data={charts[chartIndex]} />
      </div>
    </div>
  );
}
