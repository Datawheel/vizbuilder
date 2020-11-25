import {assign} from "d3plus-common";
import {relativeStdDev} from "./math";
import {sortByCustomKey} from "./sort";

/**
 * @typedef UIParams
 * @property {string} currentChart
 * @property {number} currentPeriod
 * @property {boolean} isSingleChart
 * @property {boolean} isUniqueChart
 * @property {boolean} showConfidenceInt
 * @property {(period: Date) => void} [onPeriodChange]
 * @property {string} locale
 * @property {(template: string, data?: Record<string, string>) => string} translate
 * @property {any} [measureConfig]
 * @property {any} [userConfig]
 */

// TODO: setup measureConfig

/**
 * @param {VizBldr.Struct.Chart} chart
 * @param {UIParams} uiParams
 */
export function createChartConfig(chart, uiParams) {
  const {chartType, dg, measureSet, levels} = chart;
  const {timeDrilldown} = dg;
  const {formatter, measure} = measureSet;
  const {isSingleChart, isUniqueChart} = uiParams;

  const levelNames = levels.map(lvl => lvl.caption);
  const measureName = measure.name;
  const getMeasureValue = d => d[measureName];

  const isEnlarged = uiParams.currentChart === chart.key || isUniqueChart;

  const config = assign(
    {
      legend: false,
      duration: 0,

      total: false,
      totalFormat: d => `Total: ${formatter(d)}`,

      xConfig: {
        duration: 0
        // title: null
      },
      yConfig: {
        duration: 0,
        title: measureName,
        tickFormat: formatter
      },
      label: labelFunctionGenerator(...levelNames),
      locale: uiParams.locale,

      shapeConfig: {
        duration: 0
      },

      sum: getMeasureValue,
      value: getMeasureValue
    },
    makeConfig[chartType](chart, uiParams)
  );

  if (
    ["Percentage", "Rate"].indexOf(`${measure.annotations.units_of_measurement}`) === -1 &&
    ["SUM", "UNKNOWN"].indexOf(measure.aggregatorType) > -1
  ) {
    config.total = getMeasureValue;
  }

  if (timeDrilldown && config.time) {
    const timeDrilldownName = timeDrilldown.caption;
    const {currentPeriod} = uiParams;

    // eslint-disable-next-line eqeqeq
    config.timeFilter = d => d[timeDrilldownName] == currentPeriod;
    config.timeline = isEnlarged;
    config.timelineConfig = {
      on: {end: uiParams.onPeriodChange}
    };
  }

  config.data = chart.dg.dataset;
  config.tooltipConfig = tooltipGenerator(chart, uiParams);
  config.zoom = chartType === "geomap" && isSingleChart;

  // if (config.title === undefined) {
  //   config.title = chartTitleGenerator(chart, {
  //     activeChart,
  //     selectedTime,
  //     isTimeline: isTimeline || config.timeline
  //   });
  // }

  return config;
}

/** @type {Record<VizBldr.ChartType, (chart: VizBldr.Struct.Chart, uiParams: UIParams) => any>} */
const makeConfig = {

  /** */
  barchart(chart, uiParams) {
    const {levels, dg} = chart;
    const {timeDrilldown: timeLevel} = dg;
    const {formatter, measure} = chart.measureSet;

    const firstLevel = levels[0];
    const firstLevelName = firstLevel.caption;
    const measureName = measure.name;

    const config = assign(
      {
        discrete: "y",
        x: measureName,
        xConfig: {
          title: measureName,
          tickFormat: formatter
        },
        y: firstLevelName,
        yConfig: {
          title: firstLevelName,
          ticks: []
        },
        stacked: firstLevel.depth > 1,
        shapeConfig: {
          Bar: {
            labelConfig: {
              textAnchor: "start"
            }
          }
        },
        ySort: sortByCustomKey(firstLevelName, dg.members[firstLevelName])
      },
      uiParams.userConfig
    );

    if (timeLevel) {
      const hierarchy = timeLevel.hierarchy;
      config.groupBy = hierarchy.levels.slice(0, 1)
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
    const timeLevelName = timeLevel ? timeLevel.caption : levels[0].caption;

    const config = assign(
      {
        discrete: "x",
        x: timeLevelName,
        xConfig: {
          title: timeLevelName
        },
        y: measureName,
        yConfig: {
          title: measureName,
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
          title: measure.name,
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
  lineplot(chart, {userConfig, showConfidenceInt}) {
    const {levels, dg} = chart;
    const {timeDrilldown: timeLevel} = dg;
    const {formatter, measure} = chart.measureSet;

    const levelName = levels[0].caption;
    const measureName = measure.name;
    const timeLevelName = timeLevel ? timeLevel.caption : levelName;

    const config = assign(
      {
        confidence: false,
        discrete: "x",
        groupBy: levels.map(lvl => lvl.caption),
        x: timeLevelName,
        xConfig: {title: timeLevelName},
        y: measureName,
        yConfig: {
          scale: "linear",
          title: measureName,
          tickFormat: formatter
        }
      },
      userConfig
    );

    if (config.yConfig && relativeStdDev(dg.dataset, measureName) > 1) {
      config.yConfig.scale = "log";
      config.yConfig.title += " (Log)";
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

    delete config.time;
    delete config.total;

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
    config.yConfig = {scale: "linear", title: measure.name};

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

    return config;
  }
};

/**
 * Checks if all the additional measures (MoE, UCI, LCI) in a dataset are different from zero.
 * @see Issue#257 on {@link https://github.com/Datawheel/canon/issues/257 | Github}
 * @param {any[]} dataset The dataset to analyze.
 * @param {Record<string, string>} names
 */
function areMetaMeasuresZero(
  dataset,
  {moeName, lciName, uciName, sourceName, collectionName}
) {
  const results = {};
  let n = dataset.length;
  while (n--) {
    const item = dataset[n];
    results.moe = results.moe || !(isNaN(item[moeName]) || item[moeName] === 0);
    results.lci = results.lci || !(isNaN(item[lciName]) || item[lciName] === 0);
    results.uci = results.uci || !(isNaN(item[uciName]) || item[uciName] === 0);
    results.src = results.src || !!item[sourceName];
    results.clt = results.clt || !!item[collectionName];
  }
  return results;
}

/**
 * Generates the function to render the labels in the shapes of a chart.
 * @param {string} lvlName1
 * @param {string[]} lvlName2
 */
function labelFunctionGenerator(lvlName1, ...lvlName2) {
  return Array.isArray(lvlName2) && lvlName2.length > 0
    ? d => `${d[lvlName1]} (${lvlName2.map(k => d[k]).join(", ")})`
    : d => `${d[lvlName1]}`;
}

/**
 * Generates the parameters for the tooltip shown for the current datagroup.
 * @param {VizBldr.Struct.Chart} chart
 * @param {UIParams} params
 */
function tooltipGenerator(chart, {translate: t}) {
  const {dg, levels, measureSet} = chart;
  const {measure, collection, source, moe, uci, lci, formatter} = measureSet;

  const measureName = measure.name;
  const firstLevelName = levels[0].name;

  const collectionName = collection ? collection.name : "";
  const lciName = lci ? lci.name : "";
  const moeName = moe ? moe.name : "";
  const sourceName = source ? source.name : "";
  const uciName = uci ? uci.name : "";

  const shouldShow = areMetaMeasuresZero(chart.dg.dataset, {
    collectionName,
    lciName,
    moeName,
    sourceName,
    uciName
  });

  const tbody = Object.keys(dg.members)
    .filter(lvl => lvl !== firstLevelName)
    .map(lvl => [lvl, d => d[lvl]]);
  tbody.push([measureName, d => formatter(d[measureName])]);

  // TODO: Add this
  // if (measure.aggregationType === "SUM") {
  //   const percentFormatter = formatters.Rate;
  //   tbody.push([
  //     t("Vizbuilder.chart_labels.measure_share", {measureName}),
  //     d => percentFormatter(d[`${measureName} Share`])
  //   ]);
  // }

  if (shouldShow.lci && shouldShow.uci) {
    tbody.push([
      t("Vizbuilder.chart_labels.ci"),
      d => `${formatter(d[lciName] * 1 || 0)} - ${formatter(d[uciName] * 1 || 0)}`
    ]);
  }
  else if (shouldShow.moe) {
    tbody.push([
      t("Vizbuilder.chart_labels.moe"),
      d => `± ${formatter(d[moeName] * 1 || 0)}`
    ]);
  }

  if (shouldShow.src) {
    tbody.push([t("Vizbuilder.chart_labels.source"), d => `${d[sourceName]}`]);
  }

  if (shouldShow.clt) {
    tbody.push([t("Vizbuilder.chart_labels.collection"), d => `${d[collectionName]}`]);
  }

  dg.filters.forEach(filter => {
    const {measure, formatter} = filter;
    const measureName = measure.name;
    if (dg.params.measures.some(item => item.measure === measureName)) {
      tbody.push([measureName, d => `${formatter(d[measureName])}`]);
    }
  });

  return {
    title: d => [].concat(d[firstLevelName]).join(", "),
    tbody
  };
}
