/**
 * Generates the parameters for the tooltip shown for the current datagroup.
 * @param {VizBldr.Struct.Chart} chart
 * @param {VizBldr.UIParams} uiParams
 */
export function tooltipGenerator(chart, {translate: t}) {
  const {dg, levels, measureSet} = chart;
  const {measure, collection, source, moe, uci, lci, formatter} = measureSet;

  const measureName = measure.name;
  const firstLevelName = levels[0]?.name;

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

  // TODO: restore measure share tooltip
  // if (measure.aggregationType === "SUM") {
  //   const percentFormatter = formatters.Rate;
  //   tbody.push([
  //     t("chart_labels.measure_share", {measureName}),
  //     d => percentFormatter(d[`${measureName} Share`])
  //   ]);
  // }

  if (shouldShow.lci && shouldShow.uci) {
    tbody.push([
      t("chart_labels.ci"),
      d => `${formatter(d[lciName] * 1 || 0)} - ${formatter(d[uciName] * 1 || 0)}`
    ]);
  }
  else if (shouldShow.moe) {
    tbody.push([
      t("chart_labels.moe"),
      d => `± ${formatter(d[moeName] * 1 || 0)}`
    ]);
  }

  if (shouldShow.src) {
    tbody.push([t("chart_labels.source"), d => `${d[sourceName]}`]);
  }

  if (shouldShow.clt) {
    tbody.push([t("chart_labels.collection"), d => `${d[collectionName]}`]);
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