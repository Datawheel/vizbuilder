import {filterMap} from "./array";
import {findTimeRange} from "./find";
import {getCaption, getColumnId} from "./strings";

/**
 * Returns a common title string from a list of parameters.
 * ---------------------------------------------------------
 * Examples of title variations:
 *
 * Standard drilldowns with no cuts:
 * _MEASURE_NAME by DRILLDOWN_1 and DRILLDOWN_2_
 *
 * Special aggregation type (e.g. average):
 * _AGGREGATOR_TYPE_NAME MEASURE_NAME by DRILLDOWN_
 *
 * Chart with single drilldown of type "time" used to filter data using "timeline" feature:
 * _MEASURE_NAME Over Time_
 *
 * Chart with time drilldown plotted on axis:
 * _MEASURE_NAME by DRILLDOWN (TIME_LEVEL_NAME: CURRENT_PERIOD)_
 *
 * Chart with cuts applied _on levels not included in drilldowns/levels_:
 * _MEASURE_NAME of Selected CUT_LEVEL_NAME Members by DRILLDOWN_1_
 *
 * @param {VizBldr.Struct.Chart} chart
 * @param {VizBldr.UIParams} uiParams
 */
export function chartTitleGenerator(chart, uiParams) {
  const {dg, measureSet} = chart;
  const {locale, members} = dg;
  const {translate} = uiParams;

  let title;

  // FIRST, add measure (with appropriate qualifiers) to the start of the title
  title = translate("title.measure_and_modifier", {
    modifier: getAggregationTypeQualifier(measureSet.measure.aggregatorType, translate),
    measure: getCaption(measureSet.measure, locale)
  }).trim(); // remove starting or trailing whitespaces

  /** Set of cut level names, to be filtered to include only levels not accounted for in drilldowns */
  const allCutNames = new Set(dg.cuts.keys());

  /** List of Level names to include in CUT clause */
  const cutLabels = [];

  /** Labels of drilldowns with only a single member */
  const singleMemberDrilldownLabels = [];

  /** List of Dimension names to be shown as  */
  const drilldownNames = filterMap(chart.levels, level => {
    const levelName = level.caption;
    const levelCaption = getCaption(level, locale);

    const cutMembers = members[levelName];
    // if level is used as cut, and has only one member
    if (cutMembers.length === 1) {
      // don't show it as a selected cut
      allCutNames.delete(levelName);
      // but show it as a separate label
      const label = `${levelCaption}: ${cutMembers}`;
      singleMemberDrilldownLabels.unshift(label);
      return null;
    }
    allCutNames.delete(levelName);
    return levelCaption;
  });

  // if time drilldown exists but it is not included in Chart.levels but there
  // is a cut on it, add to cut level list
  if (dg.timeDrilldown?.caption && allCutNames.has(dg.timeDrilldown.caption)) {
    allCutNames.delete(dg.timeDrilldown.caption);
  }

  const remainingCutCaptions = filterMap([...allCutNames.values()], key => {
    const level = dg.cutLevels.get(key);
    return level ? getCaption(level, locale) : null;
  });
  cutLabels.unshift(...remainingCutCaptions.filter(Boolean));

  // add labels for cut levels not included in Chart.levels
  if (cutLabels.length > 0) {
    title += ` ${translate("title.of_selected_cut_members", {
      members: arrayToSentence(cutLabels, translate)
    })}`;
  }

  // add labels for levels with single member
  if (singleMemberDrilldownLabels.length > 0) {
    title += ` (${singleMemberDrilldownLabels.join(", ")})`;
  }

  // add levels with multiple members to titles
  if (drilldownNames.length > 0) {
    title += ` ${translate(`title.${chart.isTopTen ? "top" : "by"}_drilldowns`, {
      drilldowns: arrayToSentence(drilldownNames, translate)
    })}`;
  }

  let titleFn = null;

  // for charts with a time dimension...
  if (dg.timeDrilldown) {
    const timeLevelName = dg.timeDrilldown.caption;
    const timeLevelId = getColumnId(timeLevelName, dg.dataset);
    // if only one time exists, simply specify period
    if (dg.membersCount[dg.timeDrilldown.caption] === 1) {
      title += ` (${dg.dataset[0][timeLevelName]})`;
    }
    // if chart uses timeline (so that data is filtered by time period)...
    else if (chart.isTimeline) {
      // add function to add current period to title (because it should be the only period being shown)
      titleFn = data => {
        const {minTime, maxTime} = findTimeRange(data, timeLevelId, timeLevelName);
        return `${title} (${timeLevelName}: ${periodToString(minTime, maxTime !== minTime && maxTime)})`;
      };
    }
    // else, if time is shown on one axis, say "Over Time"
    else title += ` ${translate("title.over_time")}`;
  }

  return titleFn || title;
}

/**
 * @param {string[]} strings
 * @param {Function} translate
 * @returns {string}
 */
function arrayToSentence(strings, translate) {
  strings = strings.filter(Boolean);
  if (strings.length === 2) {
    return strings.join(` ${translate("sentence_connectors.and")} `);
  }
  if (strings.length > 1) {
    const bulk = strings.slice();
    const last = bulk.pop();
    return [bulk.join(", "), last].join(` ${translate("sentence_connectors.and")} `);
  }
  return strings.join("");
}

/**
 * Returns a string giving a few qualifying words (if necessary) to add to a measure in the case
 * that a measure does not have a self-evident aggregation method (like sum)
 * @param {OlapClient.AggregatorType} aggregationType
 * @param {VizBldr.UIParams["translate"]} translate - translation function
 */
function getAggregationTypeQualifier(aggregationType, translate) {
  const qualifier =
    aggregationType &&
    typeof aggregationType === "string" &&
    translate(`aggregators.${aggregationType.toLowerCase()}`);
  return qualifier && !qualifier.startsWith("aggregators.") ? qualifier : "";
}

/**
 * Converts a period to a human-readable string.
 * @param {string} start - start of period
 * @param {string=} end - (optional) end of period
 */
function periodToString(start, end) {
  return `${start}${end ? ` - ${end}` : ""}`;
}
