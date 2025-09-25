import {DimensionType, type TesseractMeasure} from "@datawheel/logiclayer-client";
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
import type {ChartSeries} from "../charts/common";
import type {DataPoint} from "../charts/datagroup";
import type {DonutChart} from "../charts/donut";
import type {Chart} from "../charts/generator";
import type {ChoroplethMap} from "../charts/geomap";
import type {LinePlot} from "../charts/lineplot";
import type {StackedArea} from "../charts/stackedarea";
import type {TreeMap} from "../charts/treemap";
import type {D3plusConfig} from "../d3plus";
import {filterMap, getLast} from "../toolbox/array";
import {type Column, getColumnEntity} from "../toolbox/columns";
import {aggregatorIn, isOneOf} from "../toolbox/validation";
import {type Formatter, useVizbuilderContext} from "./VizbuilderProvider";

export type AggregatedDataPoint = Record<string, unknown | unknown[]>;

export interface ChartBuilderParams {
  fullMode: boolean;
  getFormatter: (key: string | TesseractMeasure) => Formatter;
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

export function useD3plusConfig(chart: Chart, params: {fullMode: boolean}) {
  const {fullMode} = params;

  const {getFormatter, postprocessConfig, showConfidenceInt, translate} =
    useVizbuilderContext();

  return useMemo((): [
    React.ComponentType<{config: D3plusConfig}> | null,
    D3plusConfig | false,
  ] => {
    const params: ChartBuilderParams = {
      fullMode,
      getFormatter,
      showConfidenceInt,
      t: translate,
    };

    if (chart.type === "barchart") {
      const config = d3plusConfigBuilder.barchart(chart, params);
      return [BarChartComponent, postprocessConfig(config, chart, params)];
    }
    if (chart.type === "choropleth") {
      const config = d3plusConfigBuilder.choropleth(chart, params);
      if (chart.extraConfig.d3plus) assign(config, chart.extraConfig.d3plus);
      return [ChoroplethComponent, postprocessConfig(config, chart, params)];
    }
    if (chart.type === "donut") {
      const config = d3plusConfigBuilder.donut(chart, params);
      return [DonutComponent, postprocessConfig(config, chart, params)];
    }
    if (chart.type === "lineplot") {
      const config = d3plusConfigBuilder.lineplot(chart, params);
      return [LinePlotComponent, postprocessConfig(config, chart, params)];
    }
    if (chart.type === "stackedarea") {
      const config = d3plusConfigBuilder.stackedarea(chart, params);
      return [StackedAreaComponent, postprocessConfig(config, chart, params)];
    }
    if (chart.type === "treemap") {
      const config = d3plusConfigBuilder.treemap(chart, params);
      return [TreeMapComponent, postprocessConfig(config, chart, params)];
    }

    return [null, {data: [], locale: ""}];
  }, [chart, fullMode, getFormatter, postprocessConfig, showConfidenceInt, translate]);
}

function buildCommonConfig(chart: Chart, params: ChartBuilderParams): D3plusConfig {
  const {fullMode, getFormatter, t} = params;
  const {datagroup, series, timeline, values} = chart;

  const {locale} = datagroup;

  const listFormatter = new Intl.ListFormat(locale, {style: "long", type: "conjunction"});

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
    return hierarchy.levels.map(level => {
      const key = level.name;
      return [
        key,
        (data: AggregatedDataPoint[]) => {
          const items = data
            .map(d => d[key] as string)
            .filter((item, index, items) => items.indexOf(item) === index);
          return listFormatter.format(trimList(t, items, 4));
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
            if (_isIntegerSequence(uniqueValues)) {
              return t("title.range", {
                from: uniqueValues[0],
                to: getLast(uniqueValues),
              });
            }
            return listFormatter.format(uniqueValues.map(i => `${i}`));
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
      label: legendColumn
        ? (d: AggregatedDataPoint) => d[legendColumn] as string
        : () => values.measure.caption,
    },
    locale: datagroup.locale,
    timeline:
      fullMode &&
      timeline &&
      (timeline.level.name === "Month" ? "Month ISO" : timeline.level.name),
    timelineConfig: {
      brushing: false,
      playButton: false,
    },
    titleConfig: {
      fontSize: fullMode ? 20 : 14,
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
            Array.isArray(value)
              ? listFormatter.format(trimList(t, value, 5))
              : (value as string),
          ];
        }).concat([[meaCaption, measureFormatter(d[meaName] as number, locale)]]);
      },
    },
    total: !timeline && fullMode,
    totalFormat: d => t("title.total", {value: measureFormatter(d, locale)}),
    scrollContainer: ".vb-wrapper .vb-scrollcontainer",
  };
}

export function buildBarchartConfig(chart: BarChart, params: ChartBuilderParams) {
  const {fullMode, getFormatter, t} = params;
  const {datagroup, values, series, timeline, orientation} = chart;

  const {locale} = datagroup;
  const [mainSeries, stackedSeries] = series as [ChartSeries, ChartSeries | undefined];

  const collate = new Intl.Collator(locale, {
    numeric: true,
    ignorePunctuation: true,
  });

  const measureFormatter = getFormatter(values.measure);
  const measureAggregator =
    values.measure.annotations.aggregation_method || values.measure.aggregator;
  const measureUnits = values.measure.annotations.units_of_measurement || "";
  const isPercentage =
    measureUnits.startsWith("Percentage") || measureUnits.startsWith("Rate");

  const isStacked =
    (stackedSeries && aggregatorIn(measureAggregator, ["COUNT", "SUM"])) || isPercentage;

  const config = d3plusConfigBuilder.common(chart, params);

  const labelStack = isStacked ? series.slice(1) : series;

  assign(config, {
    barPadding: fullMode ? 5 : 1,
    discrete: chart.orientation === "horizontal" ? "y" : "x",
    groupBy:
      isStacked && stackedSeries ? stackedSeries.level.name : mainSeries.level.name,
    groupPadding: fullMode ? 5 : 1,
    label(d) {
      return labelStack.map(series => d[series.level.name]).join("\n");
    },
    legendConfig: {
      label(d) {
        return labelStack.map(series => d[series.level.name]).join("\n");
      },
    },
    stacked: isStacked,
    title: _buildTitle(t, chart),
  });

  // d3plus/d3plus#729
  if (timeline) {
    const timeLevelName = timeline.level.name;
    config.time = timeLevelName === "Month" ? "Month ISO" : timeLevelName;
  }

  if (orientation === "horizontal") {
    const sortKey = mainSeries.name;
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
      ySort:
        typeof mainSeries.type === "number"
          ? (a, b) => a[sortKey] - b[sortKey]
          : (a, b) => collate.compare(a[sortKey], b[sortKey]),
    });
  } else {
    const mainLevelName =
      mainSeries.level.name === "Month" ? "Month ISO" : mainSeries.level.name;

    assign(config, {
      x: mainLevelName,
      xConfig: {
        title: mainSeries.level.caption,
      },
      y: values.measure.name,
      yConfig: {
        title: values.measure.caption,
        tickFormat: (d: number) => measureFormatter(d, locale),
      },
    });

    if (mainSeries.dimension.type === DimensionType.TIME) {
      config.time = mainLevelName;
    }

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

  const config = d3plusConfigBuilder.common(chart, params);

  assign(config, {
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
    title: _buildTitle(t, chart),
    zoomScroll: false,
  });

  // d3plus/d3plus#729
  if (timeline) {
    const timeLevelName = timeline.level.name;
    config.time = timeLevelName === "Month" ? "Month ISO" : timeLevelName;
  }

  return config;
}

export function buildDonutConfig(chart: DonutChart, params: ChartBuilderParams) {
  const {datagroup, series, timeline, values} = chart;
  const {fullMode, getFormatter, t} = params;

  const [mainSeries] = series;

  const config = d3plusConfigBuilder.common(chart, params);

  assign(config, {
    groupBy: [mainSeries.name],
    label: d => d[mainSeries.level.name] as string,
    title: _buildTitle(t, chart),
    value: values.measure.name,
  });

  // d3plus/d3plus#729
  if (timeline) {
    const timeLevelName = timeline.level.name;
    config.time = timeLevelName === "Month" ? "Month ISO" : timeLevelName;
  }

  return config;
}

export function buildLineplotConfig(chart: LinePlot, params: ChartBuilderParams) {
  const {datagroup, series, timeline, values} = chart;
  const {fullMode, getFormatter, t} = params;

  const {dataset, locale} = datagroup;

  const measureCaption = values.measure.caption;
  const measureFormatter = getFormatter(values.measure);

  const config = d3plusConfigBuilder.common(chart, params);

  const timeLevelName =
    timeline.level.name === "Month" ? "Month ISO" : timeline.level.name;

  assign(config, {
    discrete: "x",
    label(d: AggregatedDataPoint) {
      return (
        series.map(series => d[series.level.name]).join("\n") ||
        t("title.measure_on_period", {
          values: measureCaption,
          time_period: d[timeline.level.name],
        })
      );
    },
    groupBy: series.length
      ? series.map(series => series.level.name)
      : () => measureCaption,
    time: timeLevelName,
    timeline: false,
    title: _buildTitle(t, chart),
    total: false,
    x: timeLevelName,
    xConfig: {
      scale: "time",
      title: fullMode ? timeline.level.caption : undefined,
    },
    y: values.measure.name,
    yConfig: {
      scale: "auto",
      tickFormat: (d: number) => measureFormatter(d, locale),
      title: measureCaption,
    },
  });

  if (series.length === 0) {
    config.legend = false;
  }

  return config;
}

export function buildStackedareaConfig(chart: StackedArea, params: ChartBuilderParams) {
  const {datagroup, series, timeline, values} = chart;
  const {fullMode, getFormatter, t} = params;

  const {locale} = datagroup;

  const legendColumn = series.length > 0 && series[0].level.name;

  const measureFormatter = getFormatter(values.measure);

  const config = d3plusConfigBuilder.common(chart, params);

  const timeLevelName =
    timeline.level.name === "Month" ? "Month ISO" : timeline.level.name;

  assign(config, {
    discrete: "x",
    groupBy: series.map(series => series.level.name),
    label(d: AggregatedDataPoint) {
      return series
        .slice(1)
        .map(series => d[series.level.name] as string)
        .join("\n");
    },
    legendConfig: {
      label: legendColumn
        ? (d: AggregatedDataPoint) => d[legendColumn] as string
        : () => values.measure.caption,
    },
    time: timeLevelName,
    timeline: false,
    title: _buildTitle(t, chart),
    value: values.measure.name,
    x: timeLevelName,
    xConfig: {
      title: fullMode ? timeline.level.caption : undefined,
    },
    y: values.measure.name,
    yConfig: {
      scale: "auto",
      tickFormat: (d: number) => measureFormatter(d, locale),
      title: values.measure.caption,
    },
  });

  return config;
}

export function buildTreemapConfig(chart: TreeMap, params: ChartBuilderParams) {
  const {datagroup, series, timeline, values} = chart;
  const {fullMode, getFormatter, t} = params;

  const legendColumn = series.length > 0 && series[0].level.name;

  const config = d3plusConfigBuilder.common(chart, params);

  assign(config, {
    label(d: AggregatedDataPoint) {
      return series
        .slice(1)
        .map(series => d[series.level.name] as string)
        .join("\n");
    },
    legendConfig: {
      label: legendColumn
        ? (d: AggregatedDataPoint) => d[legendColumn] as string
        : () => values.measure.caption,
    },
    groupBy: series.map(series => series.level.name),
    sum: values.measure.name,
    threshold: 0.005,
    thresholdName: series[0].level.name,
    title: _buildTitle(t, chart),
  });

  // d3plus/d3plus#729
  if (timeline) {
    const timeLevelName = timeline.level.name;
    config.time = timeLevelName === "Month" ? "Month ISO" : timeLevelName;
  }

  return config;
}

function _buildTitle(t: TranslateFunction, chart: Chart) {
  const {series, values, timeline} = chart;
  const {measure} = values;
  const aggregator = measure.annotations.aggregation_method || measure.aggregator;
  const valuesKey = `aggregator.${aggregator.toLowerCase()}`;
  const valuesCaption = t(valuesKey, {measure: measure.caption});

  const listFormatter = new Intl.ListFormat(chart.datagroup.locale, {
    style: "long",
    type: "conjunction",
  });

  const getLastTimePeriod = (
    data: DataPoint[] | undefined,
    series: NonNullable<Chart["timeline"]>,
  ) => {
    if (!data) return getLast(series.members as string[]);
    return getLast([...new Set(data.map(d => d[series.level.name]))].sort());
  };

  const getProp = <T extends {}>(obj: T, keys: string[]): string | undefined => {
    const key = keys.shift();
    return key ? obj[key] || getProp(obj, keys) : undefined;
  };

  if (series.length === 0) {
    return (data?: DataPoint[]): string => {
      if (!timeline || !data) return valuesCaption;

      const level_scale = getProp(timeline.level, ["scale", "time_scale"]);
      return t("title.measure_over_period", {
        values: valuesCaption,
        time: timeline.level.caption,
        time_period: getLastTimePeriod(data, timeline),
        time_scale: level_scale ? t(`title.scale_${level_scale}`) : "",
      });
    };
  }

  const seriesStr = (series: Chart["series"][number]) => {
    const {members} = series.captions[series.level.name] || series;

    if (members.length < 5) {
      return t("title.series_members", {
        series: series.level.caption,
        members: listFormatter.format(members as string[]),
      });
    }

    return t("title.series", {
      series: series.level.caption,
    });
  };

  return (data?: DataPoint[]): string => {
    const config = {
      values: valuesCaption.endsWith(valuesKey) ? measure.caption : valuesCaption,
      series: listFormatter.format(trimList(t, series.map(seriesStr), 4)),
      time: timeline?.level.caption,
      time_period: timeline ? getLastTimePeriod(data, timeline) : "",
      time_scale: timeline
        ? t(`title.scale_${getProp(timeline.level, ["scale", "time_scale"])}`)
        : "",
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
function trimList(t: TranslateFunction, list: string[], limit = list.length) {
  if (list.length > limit) {
    const final = t("list.n_more", {n: list.length - limit});
    return list.slice(0, limit - 1).concat(final);
  }
  return list;
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
