import {Treemap as TreeMapComponent} from "d3plus-react";
import React, {useMemo} from "react";
import {ObjectInspector} from "react-inspector";
import type {TreeMap} from "../charts/treemap";
import type {D3plusConfig} from "../d3plus";
import {useFormatter} from "./FormatterProvider";

export function D3plusTreemap(props: {config: TreeMap; fullMode: boolean}) {
  const {config: chart, fullMode} = props;

  const {getFormatter} = useFormatter();

  const config = useMemo(() => {
    const {series, timeline, values} = chart;
    const {columns, dataset, locale} = chart.datagroup;

    const measureFormatter = getFormatter(values.measure);

    const config: D3plusConfig = {
      data: dataset,
      label: d => series.map(series => d[series.level.name]).join("\n"),
      locale,
      groupBy: series.map(series => series.name),
      time: timeline?.name,
      threshold: 0.005,
      thresholdName: series[0].name,
    };

    return config;
  }, [chart, fullMode, getFormatter]);

  return (
    <>
      <TreeMapComponent config={config} />
      <ObjectInspector data={config} />
    </>
  );
}
