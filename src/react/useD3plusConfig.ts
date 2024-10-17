import type {TranslateFunction} from "@datawheel/use-translation";
import {
  BarChart as BarChartComponent,
  Geomap as ChoroplethComponent,
  Donut as DonutComponent,
  LinePlot as LinePlotComponent,
  StackedArea as StackedAreaComponent,
  Treemap as TreeMapComponent,
} from "d3plus-react";
import {assign} from "lodash-es";
import {useMemo} from "react";
import type {
  BarChart,
  Chart,
  ChoroplethMap,
  DonutChart,
  LinePlot,
  StackedArea,
  TreeMap,
} from "../charts";
import type {D3plusConfig} from "../d3plus";
import type {DataPoint, TesseractMeasure} from "../schema";
import {filterMap, getLast} from "../toolbox/array";
import {type Column, getColumnEntity} from "../toolbox/columns";
import {aggregatorIn} from "../toolbox/validation";
import {type Formatter, useFormatter} from "./FormatterProvider";

interface ChartBuilderParams {
  fullMode: boolean;
  getFormatter: (key: string | TesseractMeasure) => Formatter;
  getMeasureConfig: (measure: TesseractMeasure) => Partial<D3plusConfig>;
  showConfidenceInt: boolean;
  t: TranslateFunction;
}

export function useD3plusConfig(
  chart: Chart | undefined,
  params: Omit<ChartBuilderParams, "getFormatter">,
) {
  const {fullMode, getMeasureConfig, showConfidenceInt, t} = params;

  const {getFormatter} = useFormatter();

  return useMemo((): [
    React.ComponentType<{config: D3plusConfig}> | null,
    D3plusConfig,
  ] => {
    if (!chart) return [null, {data: "", locale: ""}];

    const params = {fullMode, getFormatter, getMeasureConfig, showConfidenceInt, t};
    const {locale} = chart.datagroup;

    if (chart.type === "barchart") {
      return [BarChartComponent, buildBarchartConfig(chart, params)];
    }
    if (chart.type === "choropleth") {
      return [ChoroplethComponent, buildChoroplethConfig(chart, params)];
    }
    if (chart.type === "donut") {
      return [DonutComponent, buildDonutConfig(chart, params)];
    }
    if (chart.type === "lineplot") {
      return [LinePlotComponent, buildLineplotConfig(chart, params)];
    }
    if (chart.type === "stackedarea") {
      return [StackedAreaComponent, buildStackedareaConfig(chart, params)];
    }
    if (chart.type === "treemap") {
      return [TreeMapComponent, buildTreemapConfig(chart, params)];
    }

    return [null, {data: "", locale}];
  }, [chart, fullMode, getFormatter, getMeasureConfig, showConfidenceInt, t]);
}

export function buildBarchartConfig(chart: BarChart, params: ChartBuilderParams) {
  const {fullMode, getFormatter, t} = params;
  const {datagroup, values, series, timeline, orientation} = chart;

  const {columns, dataset, locale} = datagroup;
  const [mainSeries, stackedSeries] = series;

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
    groupBy: stackedSeries?.name,
    groupPadding: fullMode ? 5 : 1,
    label: d => series.map(series => d[series.level.name]).join("\n"),
    legend: fullMode,
    locale,
    stacked: (stackedSeries && aggregatorIn(measureAggregator, ["SUM"])) || isPercentage,
    time: timeline?.name === "Quarter ID" ? timeline.level.name : timeline?.name,
    timeline: timeline && fullMode,
    timelineConfig: {
      brushing: false,
      playButton: false,
    },
    tooltipConfig: {
      tbody: _buildTooltipTbody(columns, values.measure, measureFormatter, locale),
    },
    total: !timeline,
  };

  if (orientation === "horizontal") {
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
}

export function buildChoroplethConfig(chart: ChoroplethMap, params: ChartBuilderParams) {
  const {datagroup, values, series, timeline} = chart;
  const {fullMode, getFormatter, t} = params;

  const {columns, dataset, locale} = datagroup;
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
      tbody: _buildTooltipTbody(columns, values.measure, measureFormatter, locale),
    },
    zoomScroll: false,
  };

  assign(config, chart.extraConfig);

  return config;
}

export function buildDonutConfig(chart: DonutChart, params: ChartBuilderParams) {
  const {datagroup, series, timeline, values} = chart;
  const {fullMode, getFormatter, t} = params;

  const {columns, dataset, locale} = datagroup;
  const [mainSeries] = series;

  const measureFormatter = getFormatter(values.measure);

  const config: D3plusConfig = {
    data: dataset,
    groupBy: [mainSeries.name],
    label: d => d[mainSeries.level.name] as string,
    locale,
    time: timeline?.name,
    timeline: fullMode && timeline,
    timelineConfig: {
      brushing: false,
      playButton: false,
    },
    tooltipConfig: {
      tbody: _buildTooltipTbody(columns, values.measure, measureFormatter, locale),
    },
    total: !timeline,
    value: values.measure.name,
  };

  return config;
}

export function buildLineplotConfig(chart: LinePlot, params: ChartBuilderParams) {
  const {datagroup, values, series, time} = chart;
  const {fullMode, getFormatter, t} = params;

  const {columns, dataset, locale} = datagroup;

  const measureFormatter = getFormatter(values.measure);

  const config: D3plusConfig = {
    data: dataset,
    discrete: "x",
    label: (d: DataPoint) => {
      return series.map(series => d[series.level.name]).join("\n");
    },
    legend: fullMode,
    locale,
    groupBy: series.map(series => series.name),
    time: time.level.name,
    timeline: fullMode,
    timelineConfig: {
      brushing: true,
      playButton: false,
    },
    tooltipConfig: {
      tbody: _buildTooltipTbody(columns, values.measure, measureFormatter, locale),
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
}

export function buildStackedareaConfig(chart: StackedArea, params: ChartBuilderParams) {
  const {datagroup, series, timeline, values} = chart;
  const {fullMode, getFormatter, t} = params;

  const {columns, dataset, locale} = datagroup;

  const measureFormatter = getFormatter(values.measure);

  const config: D3plusConfig = {
    data: dataset,
    groupBy: series.map(series => series.name),
    locale,
    time: timeline?.name,
    timeline: timeline && fullMode,
    tooltipConfig: {
      tbody: _buildTooltipTbody(columns, values.measure, measureFormatter, locale),
    },
    value: values.measure.name,
  };

  return config;
}

export function buildTreemapConfig(chart: TreeMap, params: ChartBuilderParams) {
  const {datagroup, series, timeline, values} = chart;
  const {fullMode, getFormatter, t} = params;

  const {columns, dataset, locale} = datagroup;

  const measureFormatter = getFormatter(values.measure);

  const config: D3plusConfig = {
    data: dataset,
    label: d => series.map(series => d[series.level.name]).join("\n"),
    locale,
    groupBy: series.map(series => series.name),
    sum: values.measure.name,
    threshold: 0.005,
    thresholdName: series[0].name,
    time: timeline?.name,
    timeline: timeline && fullMode,
    tooltipConfig: {
      tbody: _buildTooltipTbody(columns, values.measure, measureFormatter, locale),
    },
  };

  return config;
}

function _buildTooltipTbody(
  columns: Record<string, Column>,
  measure: TesseractMeasure,
  measureFormatter: Formatter,
  locale: string,
) {
  return d => {
    const {caption: meaCaption, name: meaName} = measure;
    return filterMap(Object.values(columns), column => {
      if (column.type === "measure") return null;
      if (column.type === "level" && column.hasID && column.isID) return null;
      const {caption, name} = getColumnEntity(column);
      return [caption, d[name]] as [string, string];
    }).concat([[meaCaption, measureFormatter(d[meaName] as number, locale)]]);
  };
}
