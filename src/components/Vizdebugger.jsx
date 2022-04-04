import cls from "classnames";
import React, {useEffect, useMemo, useState} from "react";
import {ObjectInspector} from "react-inspector";
import {normalizeMeasureConfig, resizeEnsureHandler, scrollEnsureHandler} from "../toolbox/props";
import {useCharts} from "../toolbox/useCharts";
import {TranslationProvider} from "../toolbox/useTranslation";
import {ChartCard} from "./ChartCard";

/** @type {React.FC<VizBldr.VizbuilderProps>} */
export const Vizdebugger = props => {
  const {
    charts,
    currentChart,
    currentPeriod,
    setCurrentChart,
    setCurrentPeriod
  } = useCharts(props);
  const [isUniqueChart, setUniqueChart] = useState(false);
  const [isSingleChart, setSingleChart] = useState(false);

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
    const measureConfig = normalizeMeasureConfig(props.measureConfig);

    return (
      <ChartCard
        chart={chart}
        currentChart={isSingleChart || isUniqueChart ? currentChart : ""}
        currentPeriod={currentPeriod}
        downloadFormats={props.downloadFormats}
        isSingleChart={isSingleChart}
        isUniqueChart={isUniqueChart}
        key={chart.key}
        measureConfig={measureConfig}
        onToggle={() => null}
        showConfidenceInt={props.showConfidenceInt}
        userConfig={props.userConfig}
      />
    );
  }, [currentPeriod, chart, isSingleChart, isUniqueChart, props.showConfidenceInt]);

  useEffect(() => {
    requestAnimationFrame(resizeEnsureHandler);
  }, [content]);

  return (
    <TranslationProvider
      defaultLocale={props.defaultLocale}
      translations={props.translations}
    >
      <div
        className={cls("vb-wrapper debugger", props.className)}
        onScroll={scrollEnsureHandler}
      >
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
