import {BarChart as BarChartComponent} from "d3plus-react";
import React, {useMemo} from "react";
import {ObjectInspector} from "react-inspector";
import type {BarChart} from "../charts/barchart";
import {aggregatorIn} from "../charts/common";
import type {D3plusConfig} from "../d3plus";
import type {DataPoint} from "../schema";
import {useTranslation} from "../toolbox/translation";
import {useFormatter} from "./FormatterProvider";

export function D3plusBarchart(props: {config: BarChart; fullMode: boolean}) {
  const {config: chart, fullMode} = props;

  const {t} = useTranslation();

  const {getFormatter} = useFormatter();

  const config = useMemo(() => {
    const {values, series, timeline} = chart;
    const {columns, dataset, locale} = chart.datagroup;
    const [mainSeries, ...otherSeries] = series;

    const collate = new Intl.Collator(locale, {numeric: true, ignorePunctuation: true});

    const measureFormatter = getFormatter(values.measure);
    const measureAggregator =
      values.measure.annotations.aggregation_method || values.measure.aggregator;
    const measureUnits = values.measure.annotations.units_of_measurement || "";
    const isPercentage = ["Percentage", "Rate"].includes(measureUnits);

    const config: D3plusConfig = {
      barPadding: fullMode ? 5 : 1,
      data: dataset,
      discrete: chart.orientation === "horizontal" ? "y" : "x",
      groupBy:
        otherSeries.length > 0 ? otherSeries.map(series => series.name) : undefined,
      groupPadding: fullMode ? 5 : 1,
      label: (d: DataPoint) => series.map(series => d[series.level.name]).join("\n"),
      locale,
      stacked:
        (otherSeries.length > 0 && aggregatorIn(measureAggregator, ["SUM"])) ||
        isPercentage,
      time: timeline?.name === "Quarter ID" ? timeline.level.name : timeline?.name,
      timeline: timeline && fullMode,
      timelineConfig: {
        brushing: false,
        playButton: false,
      },
      total: !timeline,
    };

    if (chart.orientation === "horizontal") {
      Object.assign(config, {
        x: values.measure.name,
        xConfig: {
          title: values.measure.caption,
          tickFormat: (d: number) => measureFormatter(d, locale),
        },
        y: mainSeries.level.name,
        yConfig: {
          title: mainSeries.level.caption,
        },
        ySort: collate.compare,
      });
    } else {
      Object.assign(config, {
        x: mainSeries.level.name,
        xConfig: {
          title: mainSeries.level.caption,
        },
        y: values.measure.name,
        yConfig: {
          title: values.measure.caption,
          tickFormat: (d: number) => measureFormatter(d, locale),
        },
      });
    }

    return config;
  }, [chart, fullMode, getFormatter]);

  return (
    <>
      <BarChartComponent config={config} />
      <ObjectInspector data={config} />
    </>
  );
}

D3plusBarchart.displayName = "BarChart";
