import type {TranslateFunction} from "@datawheel/use-translation";
import {assign} from "d3plus-common";
import {
  BarChart as BarChartComponent,
  Geomap as ChoroplethComponent,
  Donut as DonutComponent,
  LinePlot as LinePlotComponent,
  StackedArea as StackedAreaComponent,
  Treemap as TreeMapComponent,
} from "d3plus-react";
import {sortBy} from "lodash-es";
import {useMemo} from "react";
import type {BarChart} from "../charts/barchart";
import type {DonutChart} from "../charts/donut";
import type {Chart} from "../charts/generator";
import type {ChoroplethMap} from "../charts/geomap";
import type {LinePlot} from "../charts/lineplot";
import type {StackedArea} from "../charts/stackedarea";
import type {TreeMap} from "../charts/treemap";
import type {D3plusConfig} from "../d3plus";
import {
  type AggregatedDataPoint,
  type DataPoint,
  DimensionType,
  type TesseractMeasure,
} from "../schema";
import {filterMap, getLast} from "../toolbox/array";
import {type Column, getColumnEntity} from "../toolbox/columns";
import {isOneOf} from "../toolbox/validation";
import {type Formatter, useFormatter} from "./FormatterProvider";

interface ChartBuilderParams {
  fullMode: boolean;
  getFormatter: (key: string | TesseractMeasure) => Formatter;
  getMeasureConfig: (measure: TesseractMeasure) => Partial<D3plusConfig>;
  showConfidenceInt: boolean;
  t: TranslateFunction;
}

export const d3plusConfigBuilder = {
  common: buildCommonConfig,
  barchart: buildBarchartConfig,
  choropleth: buildChoroplethConfig,
  donut: buildDonutConfig,
  lineplot: buildLineplotConfig,
  stackedarea: buildStackedareaConfig,
  treemap: buildTreemapConfig,
};

export const d3plusConfigParams = {
  translationPath: "",
};

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
    if (!chart) return [null, {data: [], locale: ""}];

    const params: ChartBuilderParams = {
      fullMode,
      getFormatter,
      getMeasureConfig,
      showConfidenceInt,
      t: d3plusConfigParams.translationPath
        ? (template, data) => t(`${d3plusConfigParams.translationPath}.${template}`, data)
        : t,
    };

    if (chart.type === "barchart") {
      return [BarChartComponent, d3plusConfigBuilder.barchart(chart, params)];
    }
    if (chart.type === "choropleth") {
      const config = d3plusConfigBuilder.choropleth(chart, params);
      if (chart.extraConfig.d3plus) assign(config, chart.extraConfig.d3plus);
      return [ChoroplethComponent, config];
    }
    if (chart.type === "donut") {
      return [DonutComponent, d3plusConfigBuilder.donut(chart, params)];
    }
    if (chart.type === "lineplot") {
      return [LinePlotComponent, d3plusConfigBuilder.lineplot(chart, params)];
    }
    if (chart.type === "stackedarea") {
      return [StackedAreaComponent, d3plusConfigBuilder.stackedarea(chart, params)];
    }
    if (chart.type === "treemap") {
      return [TreeMapComponent, d3plusConfigBuilder.treemap(chart, params)];
    }

    return [null, {data: [], locale: ""}];
  }, [chart, fullMode, getFormatter, getMeasureConfig, showConfidenceInt, t]);
}

function buildCommonConfig(chart: Chart, params: ChartBuilderParams) {
  const {fullMode, getFormatter, t} = params;
  const {datagroup, series, timeline, values} = chart;

  const {locale} = datagroup;

  const measureFormatter = getFormatter(values.measure);
  const {caption: meaCaption, name: meaName} = values.measure;

  const sortedColumnList = sortBy(
    Object.values(datagroup.columns).filter(
      column =>
        column.type === "measure" ||
        column.dimension.type === DimensionType.TIME ||
        series.find(series => series.dimension.name === column.dimension.name),
    ),
    column => getColumnEntity(column).caption,
  );

  const aggsEntries = Object.values(datagroup.nonTimeHierarchies).flatMap(hierarchy => {
    return hierarchy.levels.map(axis => {
      const key = axis.name;
      return [
        key,
        (data: AggregatedDataPoint[]) => {
          const items = data.map(d => d[key] as string);
          return _buildTranslatedList(t, items, 4);
        },
      ] as const;
    });
  });

  if (datagroup.timeHierarchy) {
    aggsEntries.push(
      ...datagroup.timeHierarchy.levels.slice(0, -1).map(level => {
        return [
          level.name,
          (data: AggregatedDataPoint[]) => {
            if (!Array.isArray(data)) return `${data}`;
            const uniqueValues = [
              ...new Set(data.map(d => d[level.name] as number)),
            ].sort();
            if (uniqueValues.length === 1) return uniqueValues[0].toString();
            if (_isIntegerSequence(uniqueValues))
              return t("title.range", {
                from: uniqueValues[0],
                to: getLast(uniqueValues),
              });
            return _buildTranslatedList(
              t,
              uniqueValues.map(i => `${i}`),
            );
          },
        ] as const;
      }),
    );
  }

  const legendColumn = series.length > 0 && series[series.length - 1].level.name;

  return {
    aggs: aggsEntries.length > 0 ? Object.fromEntries(aggsEntries) : undefined,
    data: datagroup.dataset,
    legend: fullMode,
    legendConfig: {
      label: legendColumn ? d => d[legendColumn] : d => values.measure.caption,
    },
    locale: datagroup.locale,
    timeline: fullMode && timeline?.level.name,
    timelineConfig: {
      brushing: false,
      playButton: false,
    },
    tooltip: true,
    tooltipConfig: {
      title(d) {
        if (!timeline) {
          return values.measure.caption;
        }
        if (series.length === 0) {
          return t("title.measure_on_period", {
            values: values.measure.caption,
            time_period: d[timeline.level.name],
          });
        }
        const lastSeries = getLast(series);
        return d[lastSeries.level.name] as string;
      },
      tbody(d: AggregatedDataPoint) {
        return filterMap<Column, [string, string]>(sortedColumnList, column => {
          if (column.type === "measure") return null;
          if (column.type === "level" && column.hasID && column.isID) return null;
          const {caption, name} = getColumnEntity(column);
          const value = d[name];
          return [
            caption,
            Array.isArray(value) ? _buildTranslatedList(t, value, 5) : (value as string),
          ];
        }).concat([[meaCaption, measureFormatter(d[meaName] as number, locale)]]);
      },
    },
    total: !timeline && fullMode,
    totalFormat: d => t("title.total", {value: measureFormatter(d, locale)}),
  };
}

export function buildBarchartConfig(chart: BarChart, params: ChartBuilderParams) {
  const {fullMode, getFormatter, t} = params;
  const {datagroup, values, series, timeline, orientation} = chart;

  const {locale} = datagroup;
  const [mainSeries, stackedSeries] = series;

  const collate = new Intl.Collator(locale, {
    numeric: true,
    ignorePunctuation: true,
  });

  const measureFormatter = getFormatter(values.measure);
  const measureAggregator =
    values.measure.annotations.aggregation_method || values.measure.aggregator;
  const measureUnits = values.measure.annotations.units_of_measurement || "";
  const isPercentage = ["Percentage", "Rate"].includes(measureUnits);

  const isStacked =
    (stackedSeries && isOneOf(measureAggregator.toUpperCase(), ["COUNT", "SUM"])) ||
    isPercentage;

  const config: D3plusConfig = {
    ...d3plusConfigBuilder.common(chart, params),
    barPadding: fullMode ? 5 : 1,
    discrete: chart.orientation === "horizontal" ? "y" : "x",
    groupBy: stackedSeries?.level.name,
    groupPadding: fullMode ? 5 : 1,
    label:
      isStacked && stackedSeries
        ? d => d[stackedSeries.level.name] as string
        : d => series.map(series => d[series.level.name]).join("\n"),
    stacked: isStacked,
    title: _buildTitle(t, chart),
    titleConfig: {
      fontSize: fullMode ? 20 : 10,
    },
  };

  if (timeline) {
    config.time = timeline.name === "Quarter ID" ? timeline.level.name : timeline.name;
  }

  if (orientation === "horizontal") {
    assign(config, {
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
    assign(config, {
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
    if (fullMode && config.groupBy) {
      assign(config, {
        barPadding: 3,
        groupPadding: 20,
      });
    }
  }

  return config;
}

export function buildChoroplethConfig(chart: ChoroplethMap, params: ChartBuilderParams) {
  const {datagroup, values, series, timeline} = chart;
  const {fullMode, getFormatter, t} = params;

  const {locale} = datagroup;
  const {members: firstSeriesMembers} = series[0];

  const measureFormatter = getFormatter(values.measure);

  const config: D3plusConfig = {
    ...d3plusConfigBuilder.common(chart, params),
    colorScale: values.measure.name,
    colorScaleConfig: {
      axisConfig: {
        tickFormat: (d: number) => measureFormatter(d, locale),
      },
      scale: "jenks",
    },
    colorScalePosition: fullMode ? "right" : false,
    fitFilter: d => (firstSeriesMembers as string[]).includes(d.id ?? d.properties.id),
    groupBy: series.map(series => series.name),
    label: d => series.map(series => d[series.level.name]).join("\n"),
    ocean: "transparent",
    projectionRotate: [0, 0],
    tiles: false,
    time: timeline?.level.name,
    title: _buildTitle(t, chart),
    titleConfig: {
      fontSize: fullMode ? 20 : 10,
    },
    zoomScroll: false,
  };

  return config;
}

export function buildDonutConfig(chart: DonutChart, params: ChartBuilderParams) {
  const {datagroup, series, timeline, values} = chart;
  const {fullMode, getFormatter, t} = params;

  const [mainSeries] = series;

  const config: D3plusConfig = {
    ...d3plusConfigBuilder.common(chart, params),
    groupBy: [mainSeries.name],
    label: d => d[mainSeries.level.name] as string,
    time: timeline?.level.name,
    title: _buildTitle(t, chart),
    titleConfig: {
      fontSize: fullMode ? 20 : 10,
    },
    value: values.measure.name,
  };

  return config;
}

export function buildLineplotConfig(chart: LinePlot, params: ChartBuilderParams) {
  const {datagroup, series, timeline, values} = chart;
  const {fullMode, getFormatter, t} = params;

  const {locale} = datagroup;

  const measureCaption = values.measure.caption;
  const measureFormatter = getFormatter(values.measure);

  const config: D3plusConfig = {
    ...d3plusConfigBuilder.common(chart, params),
    discrete: "x",
    label: (d: DataPoint) => {
      return (
        series.map(series => d[series.level.name]).join("\n") ||
        t("title.measure_on_period", {
          measure: measureCaption,
          period: d[timeline.level.name],
        })
      );
    },
    groupBy: series.length
      ? series.map(series => series.level.name)
      : () => measureCaption,
    time: timeline.level.name,
    timeline: false,
    title: _buildTitle(t, chart),
    titleConfig: {
      fontSize: fullMode ? 20 : 10,
    },
    total: false,
    x: timeline.level.name,
    xConfig: {
      title: fullMode ? timeline.level.caption : undefined,
    },
    y: values.measure.name,
    yConfig: {
      scale: "auto",
      tickFormat: (d: number) => measureFormatter(d, locale),
      title: measureCaption,
    },
  };

  return config;
}

export function buildStackedareaConfig(chart: StackedArea, params: ChartBuilderParams) {
  const {datagroup, series, timeline, values} = chart;
  const {fullMode, getFormatter, t} = params;

  const {locale} = datagroup;

  const measureFormatter = getFormatter(values.measure);

  const config: D3plusConfig = {
    ...d3plusConfigBuilder.common(chart, params),
    discrete: "x",
    groupBy: series.map(series => series.level.name),
    time: timeline.level.name,
    timeline: false,
    title: _buildTitle(t, chart),
    titleConfig: {
      fontSize: fullMode ? 20 : 10,
    },
    value: values.measure.name,
    x: timeline.name,
    xConfig: {
      title: fullMode ? timeline.level.caption : undefined,
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

export function buildTreemapConfig(chart: TreeMap, params: ChartBuilderParams) {
  const {datagroup, series, timeline, values} = chart;
  const {fullMode, getFormatter, t} = params;

  const commonConfig = d3plusConfigBuilder.common(chart, params);

  const legendColumn = series.length > 0 && series[0].level.name;

  const config: D3plusConfig = {
    ...commonConfig,
    label: d =>
      series
        .slice(1)
        .map(series => d[series.level.name])
        .join("\n"),
    legendConfig: {
      ...commonConfig.legendConfig,
      label: legendColumn ? d => `${d[legendColumn]}` : d => values.measure.caption,
    },
    groupBy: series.map(series => series.level.name),
    sum: values.measure.name,
    threshold: 0.005,
    thresholdName: series[0].level.name,
    time: timeline?.level.name,
    title: _buildTitle(t, chart),
    titleConfig: {
      fontSize: fullMode ? 20 : 10,
    },
  };

  return config;
}

function _buildTitle(t: TranslateFunction, chart: Chart) {
  const {series, values, timeline} = chart;
  const {measure} = values;
  const aggregator = measure.annotations.aggregation_method || measure.aggregator;
  const valuesKey = `aggregator.${aggregator.toLowerCase()}`;
  const valuesCaption = t(valuesKey, {measure: measure.caption});

  const getLastTimePeriod = (
    data: DataPoint[] | undefined,
    series: NonNullable<Chart["timeline"]>,
  ) => {
    if (!data) return getLast(series.members as string[]);
    return getLast([...new Set(data.map(d => d[series.level.name]))].sort());
  };

  if (series.length === 0) {
    return (data?: DataPoint[]): string => {
      if (!timeline || !data) return valuesCaption;

      return t("title.measure_on_period", {
        measure: valuesCaption,
        period: getLastTimePeriod(data, timeline),
      });
    };
  }

  const seriesStr = (series: Chart["series"][number]) => {
    const {members} = series.captions[series.level.name] || series;

    if (members.length < 5) {
      return t("title.series_members", {
        series: series.level.caption,
        members: _buildTranslatedList(t, members as string[]),
      });
    }

    return t("title.series", {
      series: series.level.caption,
    });
  };

  return (data?: DataPoint[]): string => {
    const config = {
      values: valuesCaption.endsWith(valuesKey) ? measure.caption : valuesCaption,
      series: _buildTranslatedList(t, series.map(seriesStr), 4),
      time: timeline?.level.caption,
      time_period: timeline ? getLastTimePeriod(data, timeline) : "",
    };

    // time is on the axis, so multiple periods are shown at once
    if (isOneOf(chart.type, ["lineplot", "stackedarea"])) {
      return t("title.main_over_period", config);
    }

    // time is on timeline dimension, so a single period is shown
    if (timeline) {
      return t("title.main_on_period", config);
    }

    // time dimension is not part of the chart
    return t("title.main", config);
  };
}

/**
 * Concatenates a list of strings, by offering the possibility to use special
 * syntax for the first and last items.
 */
function _buildTranslatedList(
  t: TranslateFunction,
  array: string[],
  limit = array.length,
) {
  if (array.length === 0) {
    return "";
  }
  if (array.length === 1) {
    return array[0];
  }

  let list = array;
  if (list.length > limit) {
    const final = t("list.n_more", {n: list.length - limit});
    list = list.slice(0, limit - 1).concat(final);
  }

  return t("list.suffix", {
    n: list.length,
    nlessone: list.length - 1,
    item: getLast<unknown>(list),
    rest: t("list.prefix", {
      n: list.length - 1,
      nlessone: list.length - 2,
      item: list[0],
      rest: list.slice(1, -1).join(t("list.join")),
      list: list.slice(0, -1).join(t("list.join")),
    }),
    list: list.join(t("list.join")),
  });
}

function _isIntegerSequence(list: number[]) {
  if (list.length < 2) return true;
  for (let i = 1; i < list.length; i++) {
    if (list[i] !== list[i - 1] + 1) {
      return false;
    }
  }
  return true;
}
