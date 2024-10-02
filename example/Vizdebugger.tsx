import cls from "clsx";
import React, {useEffect, useMemo, useState} from "react";
import {ObjectInspector} from "react-inspector";
import type {VizbuilderProps} from "../src";
import {ChartCard} from "../src/components/ChartCard";
import {asArray} from "../src/toolbox/array";
import {generateCharts, normalizeAccessor} from "../src/toolbox/generateCharts";
import {TranslationProvider} from "../src/toolbox/translation";

export function Vizdebugger(props: VizbuilderProps) {
  const {chartLimits, chartTypes} = props;

  const [currentChart, setCurrentChart] = useState("");
  const [isUniqueChart, setUniqueChart] = useState(false);
  const [isSingleChart, setSingleChart] = useState(false);

  const charts = useMemo(
    () =>
      generateCharts(asArray(props.queries), {
        chartLimits: chartLimits,
        chartTypes: chartTypes,
        datacap: props.datacap,
        topojsonConfig: props.topojsonConfig,
      }),
    [props.queries, chartLimits, chartTypes, props.datacap, props.topojsonConfig],
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
    <TranslationProvider
      defaultLocale={props.defaultLocale}
      translations={props.translations}
    >
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
          <ObjectInspector data={props.queries} />
          <ObjectInspector data={charts[chartIndex]} />
        </div>
      </div>
    </TranslationProvider>
  );
}
