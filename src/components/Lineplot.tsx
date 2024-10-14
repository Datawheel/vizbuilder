import {LinePlot as LinePlotComponent} from "d3plus-react";
import React, {useMemo} from "react";
import {ObjectInspector} from "react-inspector";
import type {LinePlot} from "../charts/lineplot";
import type {DataPoint} from "../schema";
import type {D3plusConfig} from "../structs";
import {useTranslation} from "../toolbox/translation";
import {useFormatter} from "./FormatterProvider";

export function D3plusLineplot(props: {config: LinePlot; fullMode: boolean}) {
  const {config: chart, fullMode} = props;

  const {t} = useTranslation();

  const {getFormatter} = useFormatter();

  const config = useMemo(() => {
    const {values, series, time} = chart;
    const {columns, dataset, locale} = chart.datagroup;

    const measureFormatter = getFormatter(values.measure);

    const config: Partial<D3plusConfig> = {
      data: dataset,
      discrete: "x",
      label: (d: DataPoint) => {
        return series.map(series => d[series.level.name]).join("\n");
      },
      legend: fullMode,
      groupBy: series.map(series => series.name),
      time: time.level.name,
      timeline: fullMode,
      timelineConfig: {
        brushing: true,
        playButton: false,
      },
      total: false,
      x: time.level.name,
      xConfig: {
        title: time.level.caption,
      },
      y: values.measure.name,
      yConfig: {
        scale: "auto",
        tickFormat: (d: number) => measureFormatter(d, locale),
        title: values.measure.caption,
      },
    };

    return config;
  }, [chart, fullMode, getFormatter]);

  return (
    <>
      <LinePlotComponent config={config} />
      <ObjectInspector data={config} />
    </>
  );
}

D3plusLineplot.displayName = "LinePlot";
