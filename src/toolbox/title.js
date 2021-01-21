/**
 * Returns a common title string from a list of parameters.
 * @param {VizBldr.Struct.Chart} chart
 */
export function chartTitleGenerator(chart, {currentChart, currentPeriod}) {
  const {dg, measureSet} = chart;
  const {stdDrilldowns, timeDrilldown, members} = dg;

  const timeLevelName = timeDrilldown?.name;
  const measureName = measureSet.measure.name;

  const getName = obj => obj.name;
  const levels = chart.levels.map(getName);
  const appliedCuts = [...dg.cuts.keys()];

  const cuts = [];

  let n = stdDrilldowns.length;
  while (n--) {
    const level = stdDrilldowns[n];
    const levelName = level.caption;
    const values = members[levelName];

    let label;
    if (appliedCuts.indexOf(levelName) === -1) {
      // label = `All ${pluralize(levelName, 2)}`;
      continue;
    }
    else if (values.length > 1) {
      label = `the ${values.length} selected cuts for ${levelName}`;
    }
    else if (values.length === 1) {
      label = values[0];
      const levelIndex = levels.indexOf(levelName);
      if (levelIndex > -1) {
        levels.splice(levelIndex, 1);
      }
    }
    cuts.unshift(label);
  }

  let title = measureName;

  if (levels.length > 0) {
    if (chart.isTopTen) {
      title += ` for top ${joinStringsWithCommaAnd(levels)}`;
    }
    else {
      title += ` by ${joinStringsWithCommaAnd(levels)}`;
    }
  }

  if (cuts.length > 0) {
    title += `, for ${joinStringsWithCommaAnd(cuts)}`;
  }

  if (timeLevelName) {
    if (chart.key === currentChart && ["lineplot", "stacked"].includes(chart.chartType)) {
      title += ` (${currentPeriod})`;
    }
    else {
      title = title
        .replace(measureName, `${measureName} by ${timeLevelName},`)
        .replace(",,", ",");
    }
  }

  return title;
}

/**
 * @param {string[]} strings 
 * @returns {string}
 */
function joinStringsWithCommaAnd(strings) {
  if (strings.length > 1) {
    const bulk = strings.slice();
    const last = bulk.pop();
    return `${bulk.join(", ")}, and ${last}`;
  }
  return strings.join("");
}
