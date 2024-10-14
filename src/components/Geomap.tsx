import {assign} from "d3plus-common";
import {Geomap as ChoroplethComponent} from "d3plus-react";
import React, {useMemo} from "react";
import {ObjectInspector} from "react-inspector";
import type {ChoroplethMap} from "../charts/geomap";
import type {D3plusConfig} from "../d3plus";
import {useFormatter} from "./FormatterProvider";

export function D3plusChoropleth(props: {config: ChoroplethMap; fullMode: boolean}) {
  const {config: chart, fullMode} = props;

  const {getFormatter} = useFormatter();

  const config = useMemo(() => {
    const {values, series, timeline} = chart;
    const {columns, dataset, locale} = chart.datagroup;
    const {members: firstSeriesMembers} = series[0];

    const measureFormatter = getFormatter(values.measure);

    const config: D3plusConfig = {
      colorScale: values.measure.name,
      colorScaleConfig: {
        axisConfig: {
          tickFormat: (d: number) => measureFormatter(d, locale),
        },
        scale: "jenks",
      },
      colorScalePosition: fullMode ? "right" : false,
      data: dataset,
      fitFilter: d => (firstSeriesMembers as string[]).includes(d.id ?? d.properties.id),
      groupBy: series.map(series => series.name),
      label: d => series.map(series => d[series.level.name]).join("\n"),
      ocean: "transparent",
      projectionRotate: [0, 0],
      tiles: false,
      time: timeline?.level.name,
      timeline: fullMode && timeline?.level.name,
      timelineConfig: {
        brushing: false,
        playButton: false,
      },
      zoomScroll: false,
    };

    assign(config, chart.extraConfig);

    return config;
  }, [chart, fullMode, getFormatter]);

  return (
    <>
      <ChoroplethComponent config={config} />
      <ObjectInspector data={config} />
    </>
  );
}
