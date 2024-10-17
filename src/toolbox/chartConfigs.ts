import {assign} from "d3plus-common";
import {includes} from "lodash-es";
import type {ChartType} from "../charts/common";
import type {D3plusConfig} from "../d3plus";
import type {UIParams} from "../types";
import type {Chart} from "./charts";
import {getCaption} from "./columns";
import {propertySorterFactory} from "./sort";
import {chartTitleGenerator} from "./title";
import {tooltipGenerator} from "./tooltip";

/** */
export function createChartConfig(chart: Chart, uiParams: UIParams): D3plusConfig {
  const {translate: t} = uiParams;
  const {chartType, dg, measureSet, levels} = chart;
  const {timeDrilldown, locale} = dg;
  const {formatter, measure} = measureSet;
  const {isSingleChart, isUniqueChart, userConfig} = uiParams;
  const d3plusLocale = userConfig.locale || locale;

  const levelNames = levels.map(lvl => lvl.caption);
  const measureName = measure.name;

  const isEnlarged = uiParams.currentChart === chart.key || isUniqueChart;

  const bigMode = isEnlarged || isSingleChart;

  const config = assign(
    {
      tooltipConfig: tooltipGenerator(chart, uiParams),

      totalFormat: (d: any) => `${t("title.total")}: ${formatter(d, d3plusLocale)}`,

      yConfig: {
        title: getCaption(measure, locale),
        tickFormat: (d: any) => formatter(d, d3plusLocale),
      },

      label: labelFunctionGenerator(...levelNames),
      locale: d3plusLocale,

      sum: measureName,
      value: measureName,
    },
    makeConfig[chartType](chart, uiParams, bigMode),
    userConfig,
  );

  if (config.title === undefined) {
    config.title = chartTitleGenerator(chart, uiParams);
  }

  if (
    !includes(["Percentage", "Rate"], measure.annotations.units_of_measurement) &&
    includes(["sum", "unknown"], measure.aggregator)
  ) {
    config.total = bigMode ? measureName : false;
  }

  if (timeDrilldown && config.time && chart.isTimeline) {
    config.timeline = true;
  }

  assign(config, uiParams.measureConfig(measure) || {});
  config.data = dg.dataset;

  // non-overridable config options that cleans up visualizations
  // when displayed in small tiles (mostly hiding things)
  if (!bigMode) {
    const hiddenAxis = {
      barConfig: {
        stroke: "transparent",
      },
      padding: 0,
      tickFormat: () => false,
      tickSize: 0,
      shapeConfig: {
        fill: "transparent",
        height: 0,
        label: false,
        stroke: "transparent",
        r: 0,
        width: 0,
      },
      title: false,
    };

    assign(config, {
      colorScalePosition: false,
      legend: false,

      timeline: false,
      timePersist: false,

      subtitlePadding: false,
      titlePadding: false,
      total: false,
      xConfig: hiddenAxis,
      yConfig: hiddenAxis,

      zoom: false,
    });
  }

  return config;
}

const makeConfig: Record<
  ChartType,
  (chart: Chart, uiParams: UIParams, bigMode: boolean) => D3plusConfig
> = {
  barchart(chart, uiParams, bigMode) {
    const {levels, dg} = chart;
    const {locale, timeDrilldown: timeLevel} = dg;
    const {formatter, measure} = chart.measureSet;
    const d3plusLocale = uiParams.userConfig.locale || locale;

    const firstLevel = levels[0];
    const firstLevelName = firstLevel.caption;
    const measureName = measure.name;

    const config = {
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
  },

  /**
   * - chart.dg.timeDrilldown is always defined here, checked on the previous step
   */
  barchartyear(chart, uiParams, bigMode) {
    const {levels, dg} = chart;
    const {locale, timeDrilldown: timeLevel} = dg;
    const {formatter, measure} = chart.measureSet;
    const d3plusLocale = uiParams.userConfig.locale || locale;
    const firstLevel = levels[0];

    const firstLevelName = firstLevel.caption;
    const measureName = measure.name;
    const timeLevelName = timeLevel ? timeLevel.caption : firstLevelName;

    const config = {
      discrete: "x",
      groupPadding: bigMode ? 5 : 1,
      time: timeLevelName,
      timeline: false,
      x: timeLevelName,
      xConfig: {
        title: timeLevel ? getCaption(timeLevel, locale) : null,
      },
      y: measureName,
      yConfig: {
        title: getCaption(measure, locale),
        tickFormat: (d: any) => formatter(d, d3plusLocale),
      },
      stacked: true,
      groupBy: [firstLevelName],
    };

    return config;
  },

  /**
   */
  donut(chart, uiParams, bigMode) {
    const {levels, dg} = chart;
    const {timeDrilldown: timeLevel} = dg;

    const config = {
      groupBy: levels.map((lvl: {caption: any}) => lvl.caption),
    };

    if (timeLevel) {
      config.time = timeLevel.caption;
    }

    return config;
  },

  geomap(chart, uiParams) {
    const {levels, dg} = chart;
    const {cuts, locale, timeDrilldown: timeLevel, geoDrilldown: geoLevel} = dg;
    const {formatter, measure} = chart.measureSet;
    const d3plusLocale = uiParams.userConfig.locale || locale;

    const measureName = measure.name;
    const geoLevelName = geoLevel ? geoLevel.caption : levels[0].caption;

    const groupByParam =
      `ID ${geoLevelName}` in dg.dataset[0]
        ? `ID ${geoLevelName}`
        : `${geoLevelName} ID` in dg.dataset[0]
          ? `${geoLevelName} ID`
          : geoLevelName;
    const config = assign(
      {
        colorScale: measureName,
        colorScaleConfig: {
          axisConfig: {
            tickFormat: (d: any) => formatter(d, d3plusLocale),
          },
          scale: "jenks",
        },
        colorScalePosition: "right",
        groupBy: [groupByParam],
        zoomScroll: false,
      },
      dg.topojsonConfig,
    );

    const geoCutMembers = cuts.get(geoLevelName);
    if (geoCutMembers && !config.fitFilter) {
      config.fitFilter = (d: {id: any}) => geoCutMembers.indexOf(d.id) > -1;
    }

    if (timeLevel) {
      config.time = timeLevel.caption;
    }

    return config;
  },

  histogram(chart, uiParams, bigMode) {
    const config = makeConfig.barchart(chart, uiParams, bigMode);
    config.groupPadding = 0;
    return config;
  },

  lineplot(chart, uiParams, bigMode) {
    const {levels, dg} = chart;
    const {locale, timeDrilldown: timeLevel} = dg;
    const {formatter, measure} = chart.measureSet;
    const {userConfig, showConfidenceInt} = uiParams;
    const d3plusLocale = userConfig.locale || locale;

    const levelName = levels[0]?.caption;
    const measureName = measure.name;
    const timeLevelName = timeLevel?.caption;
    // group by a static string if there are no other dimensions besides time
    const groupBy = levels?.length ? levels.map(lvl => lvl.caption) : () => "ALL";

    const config = {
      confidence: false,
      discrete: "x",
      groupBy,
      x: timeLevelName,
      xConfig: {
        title: timeLevel ? getCaption(timeLevel, dg.locale) : undefined,
      },
      y: measureName,
      yConfig: {
        scale: "auto",
        tickFormat: d => formatter(d, d3plusLocale),
        title: getCaption(measure, locale),
      },
      time: timeLevelName,
      timeline: false,
      total: false,
    };

    if (chart.isTopTen) {
      config.yConfig.title = `Top ${dg.membersCount[levelName]} items, ${config.yConfig.title}`;
    }

    if (showConfidenceInt && dg.members[levelName].length < 13) {
      const {moe, lci, uci} = chart.measureSet;
      if (lci && uci) {
        const lciName = lci.name;
        const uciName = uci.name;
        config.confidence = [d => d[lciName], d => d[uciName]];
      } else if (moe) {
        const moeName = moe.name;
        config.confidence = [
          d => d[measureName] - d[moeName],
          d => d[measureName] + d[moeName],
        ];
      }
    }

    return config;
  },

  pie(chart, uiParams, bigMode) {
    return makeConfig.donut(chart, uiParams, bigMode);
  },

  stacked(chart, uiParams, bigMode) {
    const {levels} = chart;
    const {measure} = chart.measureSet;

    const config = makeConfig.lineplot(chart, uiParams, bigMode);
    config.yConfig = {
      scale: "linear",
      title: getCaption(measure, chart.dg.locale),
    };

    if (levels.length > 1) {
      config.groupBy = levels.map((lvl: {caption: any}) => lvl.caption);
    }
    return config;
  },

  treemap(chart, uiParams, bigMode) {
    const {levels, dg} = chart;
    const {timeDrilldown: timeLevel} = dg;

    const firstLevel = levels[0];
    const otherLevels = levels.slice(1);

    const hierarchyLevels = firstLevel.hierarchy.levels;
    const ddIndex = hierarchyLevels.indexOf(firstLevel);

    const config = {
      groupBy: hierarchyLevels
        .slice(0, ddIndex + 1)
        .concat(otherLevels)
        .map((lvl: {caption: any}) => lvl.caption),
    };

    if (timeLevel) {
      config.time = timeLevel.caption;
    }

    // TODO - add ability to control this threshold value
    config.threshold = 0.005;
    config.thresholdName = firstLevel.caption;

    return config;
  },
};

/**
 * Generates the function to render the labels in the shapes of a chart.
 */
function labelFunctionGenerator(...levels: string[]) {
  const [lvlName1, ...lvlName2] = levels;
  return Array.isArray(lvlName2) && lvlName2.length > 0
    ? d => `${d[lvlName1]} (${lvlName2.map(k => d[k]).join(", ")})`
    : d => `${d[lvlName1]}`;
}
