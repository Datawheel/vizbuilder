import {Donut as DonutComponent} from "d3plus-react"
import React, {useMemo} from "react";
import {ObjectInspector} from "react-inspector";
import type {DonutChart} from "../charts/donut";
import type {D3plusConfig} from "../d3plus";
import type {DataPoint} from "../schema";
import {useFormatter} from "./FormatterProvider";

export function D3plusDonut(props: {config: DonutChart; fullMode: boolean}) {
  const {config: chart, fullMode} = props;

  const {getFormatter} = useFormatter();

  const config = useMemo(() => {
    const {series, timeline, values} = chart;
    const {columns, dataset, locale} = chart.datagroup;

    const measureFormatter = getFormatter(values.measure);

    const config: D3plusConfig = {
      data: dataset,
      groupBy: [series.name],
      label: (d: DataPoint) => d[series.level.name] as string,
      locale,
      time: timeline?.name,
      timeline: fullMode && timeline,
      timelineConfig: {
        brushing: false,
        playButton: false,
      },
      total: !timeline,
      value: values.measure.name,
    };

    return config;
  }, [chart, fullMode, getFormatter]);

  return (
    <>
      <DonutComponent config={config} />
      <ObjectInspector data={config} />
    </>
  );
}
