import {assign} from "d3plus-common";
import {Geomap as ChoroplethComponent} from "d3plus-react";
import React, {useMemo} from "react";
import {ObjectInspector} from "react-inspector";
import type {ChoroplethMap} from "../charts/geomap";
import type {D3plusConfig} from "../d3plus";
import {filterMap, getLast} from "../toolbox/array";
import {getColumnEntity} from "../toolbox/columns";
import {useFormatter} from "./FormatterProvider";

export function D3plusChoropleth(props: {config: ChoroplethMap; fullMode: boolean}) {
  const {config: chart, fullMode} = props;

  const {getFormatter} = useFormatter();

  const config = useMemo(() => {
    const {values, series, timeline} = chart;
    const {columns, dataset, locale} = chart.datagroup;
    const {members: firstSeriesMembers} = series[0];

    const lastSeries = getLast(series);

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
      locale,
      ocean: "transparent",
      projectionRotate: [0, 0],
      tiles: false,
      time: timeline?.level.name,
      timeline: fullMode && timeline?.level.name,
      timelineConfig: {
        brushing: false,
        playButton: false,
      },
      tooltip: true,
      tooltipConfig: {
        title(d) {
          return d[lastSeries.level.name] as string;
        },
        tbody(d) {
          const {caption: meaCaption, name: meaName} = values.measure;
          return filterMap(Object.values(columns), column => {
            if (column.type === "measure") return null;
            if (column.type === "level" && column.hasID && column.isID) return null;
            const {caption, name} = getColumnEntity(column);
            return [caption, d[name]] as [string, string];
          }).concat([[meaCaption, measureFormatter(d[meaName] as number, locale)]]);
        },
      },
      zoomScroll: false,
    };

    assign(config, chart.extraConfig);

    return config;
  }, [chart, fullMode, getFormatter]);

  return (
    <>
      <ChoroplethComponent config={config} />
      <ObjectInspector data={config} expandLevel={1} />
    </>
  );
}
