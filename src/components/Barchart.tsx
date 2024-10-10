import {BarChart as BarChartComponent} from "d3plus-react";
import React, {useMemo} from "react";
import type {BarChart} from "../charts/barchart";
import {useTranslation} from "../toolbox/translation";
import {useFormatter} from "./FormatterProvider";

export interface BarChartD3plusConfig {
  container: string; // CSS selector for the container element
  data: Record<string, unknown>[];
  x: string; // Key for the x-axis values
  y: string; // Key for the y-axis values
  groupBy?: string; // Optional grouping key
  title?: string; // Optional title for the chart
  xConfig?: {
    label?: string; // Label for the x-axis
    tickFormat?: (d: any) => string | number; // Custom tick formatting function
  };
  yConfig?: {
    label?: string; // Label for the y-axis
    tickFormat?: (d: any) => string | number; // Custom tick formatting function
  };
  barPadding?: number; // Padding between bars
  tooltip?: boolean | ((d: any) => string); // Tooltip configuration or custom function
  colorScale?: string | ((d: any) => string); // Color scale or custom color function
}

export function D3plusBarchart(props: {chart: BarChart; mode: "minimal" | "full"}) {
  const {chart, mode} = props;

  const {t} = useTranslation();

  const {getFormatter} = useFormatter();

  const config = useMemo(() => {
    const {locale, values, series, timeline} = chart;

    const measureFormatter = getFormatter(values.measure.name);
    const seriesFormatter = mapValues getFormatter(series)
    const d3plusLocale = uiParams.userConfig.locale || locale;

    const firstLevel = levels[0];
    const firstLevelName = firstLevel.caption;
    const measureName = measure.name;

    const config: BarChartD3plusConfig = {
      data: chart.dataset,
      locale,
      groupBy: [firstLevelName],
      groupPadding: bigMode ? 5 : 1,
      discrete: "y",
      x: measureName,
      xConfig: {
        title: getCaption(measure, locale),
        tickFormat: (d: any) => formatter(d, d3plusLocale),
      },
      y: firstLevelName,
      yConfig: {
        title: getCaption(firstLevel, locale),
        ticks: [],
      },
      stacked: measure.aggregator === "sum" && firstLevel.depth > 1,
      ySort: propertySorterFactory(firstLevelName, dg.members[firstLevelName]),
    };

    if (timeLevel) {
      const hierarchy = timeLevel.hierarchy;
      config.groupBy = hierarchy.levels
        .slice(0, 1)
        .filter((lvl: {caption: string}) => lvl.caption in dg.dataset[0])
        .concat(levels)
        .map((lvl: {caption: any}) => lvl.caption);
      config.time = timeLevel.caption;
    } else if (levels.length > 1) {
      config.groupBy = levels.map((lvl: {caption: any}) => lvl.caption);
    }

    if (!config.time) {
      delete config.total;
    }

    return config;
  }, [chart, t]);

  return <BarChartComponent config={config} />;
}
