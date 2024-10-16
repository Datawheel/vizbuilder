import {StackedArea as StackedAreaComponent} from "d3plus-react";
import React, {useMemo} from "react";
import {ObjectInspector} from "react-inspector";
import type {StackedArea} from "../charts/stackedarea";
import type {D3plusConfig} from "../d3plus";
import {ErrorBoundary} from "./ErrorBoundary";
import {useFormatter} from "./FormatterProvider";

export function D3plusStacked(props: {config: StackedArea; fullMode: boolean}) {
  const {config: chart, fullMode} = props;

  const {getFormatter} = useFormatter();

  const config = useMemo(() => {
    const {series, timeline, values} = chart;
    const {columns, dataset, locale} = chart.datagroup;

    const measureFormatter = getFormatter(values.measure);

    const config: D3plusConfig = {
      data: dataset,
      groupBy: series.map(series => series.name),
      locale,
      time: timeline?.name,
      timeline: timeline && fullMode,
      value: values.measure.name,
    };

    return config;
  }, [chart, fullMode, getFormatter]);

  return (
    <>
      <ErrorBoundary>
        <StackedAreaComponent config={config} />
      </ErrorBoundary>
      <ObjectInspector data={config} expandLevel={1} />
    </>
  );
}
