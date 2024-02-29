import cls from "clsx";
import React, {useEffect, useMemo, useState} from "react";
import {ObjectInspector} from "react-inspector";
import {asArray} from "../toolbox/array";
import {generateCharts, measureConfigAccessor} from "../toolbox/generateCharts";
import {TranslationProvider} from "../toolbox/useTranslation";
import {ChartCard} from "./ChartCard";

/** @type {React.FC<Vizbuilder.VizbuilderProps>} */
export const Vizdebugger = props => {
  const [currentChart, setCurrentChart] = useState("");
  const [isUniqueChart, setUniqueChart] = useState(false);
  const [isSingleChart, setSingleChart] = useState(false);

  const charts = useMemo(() => generateCharts(asArray(props.queries), {
    chartLimits: props.chartLimits,
    chartTypes: props.chartTypes,
    datacap: props.datacap,
    topojsonConfig: props.topojsonConfig
  }), [props.queries, props.chartLimits]);

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
  const chart = charts[chartIndex];

  const content = useMemo(() => {
    if (charts.length === 0) {
      return <div>No charts outputted.</div>;
    }
    if (!chart) {
      return <div>Chart with key {currentChart} not found.</div>;
    }
    const measureConfig = measureConfigAccessor(props.measureConfig || {});

    return (
      <ChartCard
        chart={chart}
        currentChart={isSingleChart || isUniqueChart ? currentChart : ""}
        downloadFormats={props.downloadFormats}
        isSingleChart={isSingleChart}
        key={chart.key}
        measureConfig={measureConfig}
        onToggle={() => null}
        showConfidenceInt={props.showConfidenceInt}
        userConfig={props.userConfig}
      />
    );
  }, [chart, isSingleChart, isUniqueChart, props.showConfidenceInt]);

  return (
    <TranslationProvider
      defaultLocale={props.defaultLocale}
      translations={props.translations}
    >
      <div className={cls("vb-wrapper debugger", props.className)}>
        <div className="vb-toolbar-wrapper">
          {props.toolbar}
          <button onClick={() => setCurrentChart(charts[Math.max(0, chartIndex - 1)].key)}>Prev</button>
          <span>{currentChart}</span>
          <button onClick={() => setCurrentChart(charts[Math.min(chartIndex + 1, charts.length - 1)].key)}>Next</button>
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
          <ObjectInspector data={chart} />
        </div>
      </div>
    </TranslationProvider>
  );
};
