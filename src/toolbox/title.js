import { findTimeRange } from "./find";
import { getColumnId } from "./strings";

/**
 * Returns a common title string from a list of parameters.
 * @param {VizBldr.Struct.Chart} chart
 * @param {object} options
 */
export function chartTitleGenerator(chart, options) {

  const {dg, measureSet} = chart;
  const {members} = dg;

  const measureName = measureSet.measure.name;

  const cuts = [];

  const allLevels = [...chart.levels];
  const allLevelNames = allLevels.map(obj => obj.name);
  const allCutNames = [...dg.cuts.keys()];

  let n = allLevels.length;
  while (n--) {
    const level = allLevels[n];
    const levelName = level.caption;
    const values = members[levelName];

    let label;
    // if level has one member, remove from level list and add as cut
    if (values.length === 1) {
      label = `${levelName}: ${values[0]}`;
      const levelIndex = allLevelNames.indexOf(levelName);
      if (levelIndex > -1) allLevelNames.splice(levelIndex, 1);
      const cutIndex = allCutNames.indexOf(levelName);
      if (levelIndex > -1) allCutNames.splice(cutIndex, 1);
      cuts.unshift(label);
    }
  }

  allCutNames.forEach(cutLvlName => {
    const numMembers = dg.cuts.get(cutLvlName)?.length;
    if (!allLevelNames.includes(cutLvlName)) {
      let label = `${cutLvlName}: ${numMembers} Selected`
      cuts.unshift(label);
    }
  });

  let title = measureName;

  if (cuts.length > 0) title += ` (${arrayToSentence(cuts)})`;

  // add levels / dimensions to titles
  if (allLevelNames.length > 0) {
    title += chart.isTopTen
      ? ` for top ${arrayToSentence(allLevelNames)}`
      : ` by ${arrayToSentence(allLevelNames)}`;
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
      }
    }
    // else, if time is shown on one axis, say "Over Time"
    else title += ` Over Time`;
  }

  if (title[title.length - 1] === ",") {
    return title.slice(0, -1)
  }

  return titleFn || title;
}

/**
 * @param {string[]} strings
 * @param {Record<string, string>} [options]
 * @returns {string}
 */
function arrayToSentence(strings, options = {}) {
  const allWords = options.all_words || ", ";
  const twoWords = options.two_words || " and ";
  const lastWord = options.last_word || ", and ";
  strings = strings.filter(Boolean);

  if (strings.length === 2) {
    return strings.join(twoWords);
  }
  if (strings.length > 1) {
    const bulk = strings.slice();
    const last = bulk.pop();
    return [bulk.join(allWords), last].join(lastWord);
  }
  return strings.join("");
}

/**
 * Converts a period to a human-readable string.
 * @param {string} start - start of period
 * @param {string=} end - (optional) end of period 
 * @returns 
 */
function periodToString(start, end) {
  return `${start}${end ? ` - ${end}` : ""}`;
}
