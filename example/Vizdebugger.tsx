import cls from "clsx";
import React, {useEffect, useMemo, useState} from "react";
import {ObjectInspector} from "react-inspector";
import type {VizbuilderProps} from "../src";
import {ChartCard} from "../src/components/ChartCard";
import {castArray} from "../src/toolbox/array";
import {generateCharts, normalizeAccessor} from "../src/toolbox/generateCharts";

export function Vizdebugger(props: VizbuilderProps) {
  const {chartLimits, chartTypes, datasets, datacap, topojsonConfig} = props;

  const charts = useMemo(
    () =>
      generateCharts(castArray(datasets), {
        chartLimits: chartLimits,
        chartTypes: chartTypes,
        datacap: datacap,
        topojsonConfig: topojsonConfig,
      }),
    [datasets, chartLimits, chartTypes, datacap, topojsonConfig],
  );

  return (
    <div>
      <ObjectInspector data={props} expandLevel={1} />
      <ObjectInspector data={charts} expandLevel={3} />
    </div>
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
