/**
 * Returns a common title string from a list of parameters.
 * @param {VizBldr.Struct.Chart} chart
 * @param {object} options
 * @param {string} options.currentChart
 * @param {[string, string]} options.currentPeriod
 */
export function chartTitleGenerator(chart, {currentPeriod}) {

  console.log("Chart", chart.chartType, chart);

  const {dg, measureSet} = chart;
  const {members} = dg;

  const measureName = measureSet.measure.name;

  const cuts = [];

  const allLevels = [...chart.levels];
  const allLevelNames = allLevels.map(obj => obj.name);

  let n = allLevels.length;
  while (n--) {
    const level = allLevels[n];
    const levelName = level.caption;
    const values = members[levelName];

    let label;
    if (values.length === 1) {
      label = `${levelName}: ${values[0]}`;
      const levelIndex = allLevelNames.indexOf(levelName);
      if (levelIndex > -1) allLevelNames.splice(levelIndex, 1);
    }
    else if (!dg.cuts.has(levelName)) {
      continue;
    }
    else if (values.length > 1) {
      label = `the ${values.length} selected cuts of ${levelName}`;
    }
    cuts.unshift(label);
  }

  let title = measureName;

  // add levels / dimensions to titles
  if (allLevelNames.length > 0) {
    title += chart.isTopTen
      ? ` for top ${arrayToSentence(allLevelNames)}`
      : ` by ${arrayToSentence(allLevelNames)}`;
  }
  
  if (dg.timeDrilldown) {
    // for charts with enabled timelines...
    if (dg.membersCount[dg.timeDrilldown.caption] === 1) {
      title += ` (${dg.dataset[0][dg.timeDrilldown.caption]})`;
    }
    else if (chart.isTimeline) {
      // add current period to title (because it should be the only period being shown)
      title += ` (${dg.timeDrilldown.caption}: ${periodToString(currentPeriod)})`;
    } else {
      title += ` over Time`;
    }
  }
  
  if (cuts.length > 0) {
    title += ` (${arrayToSentence(cuts)})`;
  }

  // if (timeLevelName) {
  //   if (chart.key === currentChart && ["lineplot", "stacked"].includes(chart.chartType)) {
  //     title += ` (${currentPeriod.filter(Boolean).join(" - ")})`;
  //   }
  //   else {
  //     title = title
  //       .replace(measureName, `${measureName} by ${timeLevelName},`)
  //       .replace(",,", ",");
  //   }
  // }

  if (title[title.length - 1] === ",") {
    return title.slice(0, -1)
  }

  return title;
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
 * 
 * @param {[string, string]} currentPeriod - array of one or two time 
 * @returns 
 */
function periodToString(currentPeriod) {
  return `${currentPeriod[0]}${currentPeriod[1] ? ` - ${currentPeriod[1]}` : ""}`;
}
