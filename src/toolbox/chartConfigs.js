import {assign} from "d3plus-common";
import includes from "lodash/includes";
import {relativeStdDev} from "./math";
import {sorterByCustomKey} from "./sort";
import {getCaption, getColumnId} from "./strings";
import {chartTitleGenerator} from "./title";
import {tooltipGenerator} from "./tooltip";

/**
 * @param {VizBldr.Struct.Chart} chart
 * @param {VizBldr.UIParams} uiParams
 */
export function createChartConfig(chart, uiParams) {
  const {chartType, dg, measureSet, levels} = chart;
  const {timeDrilldown, locale} = dg;
  const {formatter, measure} = measureSet;
  const {isSingleChart, isUniqueChart} = uiParams;

  const levelNames = levels.map(lvl => lvl.caption);
  const measureName = measure.name;

  const isEnlarged = uiParams.currentChart === chart.key || isUniqueChart;

  const config = assign(
    {
      legend: false,

      timelineConfig: {
        brushing: false,
        padding: 0
      },

      titleConfig: {
        padding: 0
      },
      titlePadding: isEnlarged || isSingleChart,

      tooltipConfig: tooltipGenerator(chart, uiParams),

      total: false,
      totalFormat: d => `Total: ${formatter(d)}`,

      yConfig: {
        title: getCaption(measure, locale),
        tickFormat: formatter
      },
      label: labelFunctionGenerator(...levelNames),
      locale,

      sum: measureName,
      value: measureName,
      zoom: isEnlarged || isSingleChart
    },
    makeConfig[chartType](chart, uiParams, isEnlarged)
  );

  if (
    !includes(["Percentage", "Rate"], measure.annotations.units_of_measurement) &&
    includes(["SUM", "UNKNOWN"], measure.aggregatorType)
  ) {
    config.total = measureName;
  }

  if (timeDrilldown && config.time && chart.isTimeline) {
    config.timeline = isEnlarged;
  }

  if (config.title === undefined) {
    config.title = chartTitleGenerator(chart, uiParams);
  }

  assign(config, uiParams.measureConfig(measure) || {});
  config.data = dg.dataset;

  return config;
}

/** @type {Record<VizBldr.ChartType, (chart: VizBldr.Struct.Chart, uiParams: VizBldr.UIParams, isEnlarged: Boolean) => any>} */
const makeConfig = {

  /** */
  barchart(chart, uiParams, isEnlarged) {
    const {levels, dg} = chart;
    const {timeDrilldown: timeLevel} = dg;
    const {formatter, measure} = chart.measureSet;

    const firstLevel = levels[0];
    const firstLevelName = firstLevel.caption;
    const measureName = measure.name;

    const config = assign(
      {
        groupBy: [firstLevelName],
        groupPadding: isEnlarged ? 5 : 1,
        discrete: "y",
        x: measureName,
        xConfig: {
          title: getCaption(measure, dg.locale),
          tickFormat: formatter
        },
        y: firstLevelName,
        yConfig: {
          title: getCaption(firstLevel, dg.locale),
          ticks: []
        },
        stacked: measure.aggregatorType === "SUM" && firstLevel.depth > 1,
        ySort: sorterByCustomKey(firstLevelName, dg.members[firstLevelName])
      },
      uiParams.userConfig
    );

    if (timeLevel) {
      const hierarchy = timeLevel.hierarchy;
      config.groupBy = hierarchy.levels
        .slice(0, 1)
        .filter(lvl => lvl.caption in dg.dataset[0])
        .concat(levels)
        .map(lvl => lvl.caption);
      config.time = timeLevel.caption;
    }
    else if (levels.length > 1) {
      config.groupBy = levels.map(lvl => lvl.caption);
    }

    if (!config.time) {
      delete config.total;
    }

    return config;
  },

  /**
   * - chart.dg.timeDrilldown is always defined here, checked on the previous step
   */
  barchartyear(chart, uiParams) {
    const {levels, dg} = chart;
    const {timeDrilldown: timeLevel} = dg;
    const {formatter, measure} = chart.measureSet;
    const firstLevel = levels[0];

    const firstLevelName = firstLevel.caption;
    const measureName = measure.name;
    const timeLevelName = timeLevel
      ? getColumnId(timeLevel.caption, dg.dataset)
      : firstLevelName;

    const config = assign(
      {
        discrete: "x",
        x: timeLevelName,
        xConfig: {
          title: timeLevel ? getCaption(timeLevel, dg.locale) : null
        },
        y: measureName,
        yConfig: {
          title: getCaption(measure, dg.locale),
          tickFormat: formatter
        },
        stacked: true,
        groupBy: [firstLevelName]
      },
      uiParams.userConfig
    );

    delete config.time;
    delete config.total;

    return config;
  },

  /**
   */
  donut(chart, uiParams) {
    const {levels, dg} = chart;
    const {timeDrilldown: timeLevel} = dg;
    const {formatter, measure} = chart.measureSet;

    const config = assign(
      {
        y: measure.name,
        yConfig: {
          title: getCaption(measure, dg.locale),
          tickFormat: formatter
        },
        groupBy: levels.map(lvl => lvl.caption)
      },
      uiParams.userConfig
    );

    if (timeLevel) {
      config.time = timeLevel.caption;
    }

    return config;
  },

  /**
   */
  geomap(chart, uiParams) {
    const {levels, dg} = chart;
    const {cuts, timeDrilldown: timeLevel, geoDrilldown: geoLevel} = dg;
    const {formatter, measure} = chart.measureSet;

    const measureName = measure.name;
    const geoLevelName = geoLevel ? geoLevel.caption : levels[0].caption;

    const groupByParam = `ID ${geoLevelName}` in dg.dataset[0]
      ? `ID ${geoLevelName}`
      : `${geoLevelName} ID` in dg.dataset[0]
        ? `${geoLevelName} ID`
        : geoLevelName;
    const config = assign(
      {
        colorScale: measureName,
        colorScaleConfig: {
          axisConfig: {
            tickFormat: formatter
          },
          scale: "jenks"
        },
        colorScalePosition: "right",
        groupBy: [groupByParam],
        zoomScroll: false
      },
      dg.topojsonConfig,
      uiParams.userConfig
    );

    const geoCutMembers = cuts.get(geoLevelName);
    if (geoCutMembers && !config.fitFilter) {
      config.fitFilter = d => geoCutMembers.indexOf(d.id) > -1;
    }

    if (timeLevel) {
      config.time = timeLevel.caption;
    }

    return config;
  },

  /**
   */
  histogram(chart, uiParams) {
    const config = makeConfig.barchart(chart, uiParams);
    config.groupPadding = 0;
    return config;
  },

  /**
   */
  lineplot(chart, uiParams) {
    const {levels, dg} = chart;
    const {timeDrilldown: timeLevel} = dg;
    const {formatter, measure} = chart.measureSet;
    const {userConfig, showConfidenceInt} = uiParams;

    const levelName = levels[0]?.caption;
    const measureName = measure.name;
    const timeLevelName = timeLevel?.caption;
    // group by a static string if there are no other dimensions besides time
    const groupBy = levels?.length ? levels.map(lvl => lvl.caption) : () => "ALL";

    const config = assign(
      {
        confidence: false,
        discrete: "x",
        groupBy,
        x: timeLevelName,
        xConfig: {
          title: timeLevel ? getCaption(timeLevel, dg.locale) : undefined
        },
        y: measureName,
        yConfig: {
          scale: "linear",
          tickFormat: formatter,
          title: measureName
        },
        time: timeLevelName,
        timeline: false,
        total: false
      },
      userConfig
    );

    if (config.yConfig && relativeStdDev(dg.dataset, measureName) > 1) {
      config.yConfig.scale = "log";
      config.yConfig.title += " (Log)";
    }

    if (chart.isTopTen) {
      config.yConfig.title = `Top ${dg.membersCount[levelName]} items, ${config.yConfig.title}`;
    }

    if (showConfidenceInt && dg.members[levelName].length < 13) {
      const {moe, lci, uci} = chart.measureSet;
      if (lci && uci) {
        const lciName = lci.name;
        const uciName = uci.name;
        config.confidence = [d => d[lciName], d => d[uciName]];
      }
      else if (moe) {
        const moeName = moe.name;
        config.confidence = [
          d => d[measureName] - d[moeName],
          d => d[measureName] + d[moeName]
        ];
      }
    }

    return config;
  },

  /**
   */
  pie(chart, uiParams) {
    return makeConfig.donut(chart, uiParams);
  },

  /**
   */
  stacked(chart, uiParams) {
    const {levels} = chart;
    const {measure} = chart.measureSet;

    const config = makeConfig.lineplot(chart, uiParams);
    config.yConfig = {
      scale: "linear",
      title: getCaption(measure, chart.dg.locale)
    };

    if (levels.length > 1) {
      config.groupBy = levels.map(lvl => lvl.caption);
    }
    return config;
  },

  /**
   */
  treemap(chart, uiParams) {
    const {levels, dg} = chart;
    const {timeDrilldown: timeLevel} = dg;

    const firstLevel = levels[0];
    const otherLevels = levels.slice(1);

    const hierarchyLevels = firstLevel.hierarchy.levels;
    const ddIndex = hierarchyLevels.indexOf(firstLevel);

    const config = assign(
      {
        groupBy: hierarchyLevels
          .slice(0, ddIndex + 1)
          .concat(otherLevels)
          .map(lvl => lvl.caption)
      },
      uiParams.userConfig
    );

    if (timeLevel) {
      config.time = timeLevel.caption;
    }

    // TODO - add ability to control this threshold value
    config.threshold = 0.005;
    config.thresholdName = firstLevel.caption;

    return config;
  }
};

/**
 * Generates the function to render the labels in the shapes of a chart.
 * @param {string[]} levels
 */
function labelFunctionGenerator(...levels) {
  const [lvlName1, ...lvlName2] = levels;
  return Array.isArray(lvlName2) && lvlName2.length > 0
    ? d => `${d[lvlName1]} (${lvlName2.map(k => d[k]).join(", ")})`
    : d => `${d[lvlName1]}`;
}
