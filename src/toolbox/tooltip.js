import {abbreviateList, getCaption} from "./strings";

/**
 * Generates the parameters for the tooltip shown for the current datagroup.
 * @param {Vizbuilder.Chart} chart
 * @param {Vizbuilder.UIParams} uiParams
 */
export function tooltipGenerator(chart, {translate: t}) {
  const {dg, measureSet} = chart;
  const {locale} = dg;
  const {measure, collection, source, moe, uci, lci, formatter} = measureSet;

  const measureName = measure.name;

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

  const titleFn = input => chart.levels
    // get drilldown names
    .map(lvl => lvl.caption)
    .map(lvlName => {
      // if there are multiple members in a drilldown level
      if (Array.isArray(input[lvlName])) {
        // ...and there is a cut applied on this drilldown level or data group has been aggregated (as in threshold of treemap)
        return dg.cuts.has(lvlName) || input._isAggregation
          // then list the members in this data point
          ? abbreviateList(input[lvlName])
          // else, show that all members are aggregated
          : `All ${lvlName}`;
      }
      return input[lvlName];
    })
    // add parentheses to drilldown labels after the first level
    .map((lvlLabel, idx) => idx > 0 ? `(${lvlLabel})` : lvlLabel)
    .join(" ");

  const bodyFn = input => {
    const output = [];

    if (shouldShow.lci && shouldShow.uci) {
      output.push([
        t("chart_labels.ci"),
        d => `${formatter(d[lciName] * 1 || 0, locale)} - ${formatter(d[uciName] * 1 || 0, locale)}`
      ]);
    }
    else if (shouldShow.moe) {
      output.push([
        t("chart_labels.moe"),
        d => `± ${formatter(d[moeName] * 1 || 0, locale)}`
      ]);
    }

    if (shouldShow.src) {
      output.push([t("chart_labels.source"), d => `${d[sourceName]}`]);
    }

    if (shouldShow.clt) {
      output.push([t("chart_labels.collection"), d => `${d[collectionName]}`]);
    }

    // if there is a time drilldown, it will not be included in the drilldown
    // levels and needs to be specified in tooltip body
    if (chart.dg.timeDrilldown) {
      const timeLvlName = getCaption(chart.dg.timeDrilldown, locale);
      const timeLvlCaption = chart.dg.timeDrilldown.caption;
      output.push([timeLvlName, input[timeLvlCaption]]);
    }

    // add measure value at end
    output.push([getCaption(measure, locale), formatter(input[measureName], locale)]);

    return output;
  };

  return {
    title: titleFn,
    tbody: bodyFn
  };
}


/**
 * Checks if all the additional measures (MoE, UCI, LCI) in a dataset are different from zero.
 * @see {@link https://github.com/Datawheel/canon/issues/257 Issue#257 on Github}
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
