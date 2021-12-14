import {Cube} from "@datawheel/olap-client";
import flatMap from "lodash/flatMap";
import {useEffect, useMemo, useState} from "react";
import {chartComponents} from "../components/ChartCard";
import {asArray} from "./array";
import {DEFAULT_CHART_LIMITS} from "./chartLimits";
import {chartRemixer} from "./charts";
import {buildDatagroup} from "./datagroup";
import {findHigherCurrentPeriod} from "./find";
import {normalizeTopojsonConfig} from "./props";
import {getColumnId} from "./strings";
import {isMatchingLevel, isTimeLevel} from "./validation";

/**
 * @param {VizBldr.VizbuilderProps} props
 */
export const useCharts = props => {
  const [currentChart, setCurrentChart] = useState("");
  const [currentPeriod, setCurrentPeriod] = useState(() =>
    getDefaultPeriod(props.queries)
  );

  const chartLimits = {...DEFAULT_CHART_LIMITS, ...(props.chartLimits || {})};

  const charts = useMemo(() => {
    const allowedChartTypes = props.allowedChartTypes || Object.keys(chartComponents);
    const datagroupProps = {
      datacap: props.datacap || 20000,
      getTopojsonConfig: normalizeTopojsonConfig(props.topojsonConfig)
    };
    return flatMap(asArray(props.queries), query => {
      const datagroup = buildDatagroup(query, datagroupProps);
      return flatMap(allowedChartTypes, chartType => chartRemixer(datagroup, chartType, chartLimits));
    });
  }, [props.queries, props.chartLimits]);

  useEffect(() => {
    const defaultPeriod = getDefaultPeriod(props.queries);
    setCurrentPeriod(defaultPeriod);
  }, [props.queries]);

  return {currentChart, setCurrentChart, currentPeriod, setCurrentPeriod, charts};
};

/**
 * Picks the default period from an external query.
 * @param {VizBldr.QueryResult | VizBldr.QueryResult[]} queries
 * @returns {[string, string]}
 */
function getDefaultPeriod(queries) {
  const defaultPeriods = asArray(queries).map(calculateDefaultPeriod);
  const defaultPeriodsUnique = [...new Set(defaultPeriods)].filter(Boolean);
  const firstDefaultPeriod = defaultPeriodsUnique[0] || "";
  return [firstDefaultPeriod, ""];
}

/**
 * @param {VizBldr.QueryResult} query
 * @returns {string}
 */
function calculateDefaultPeriod(query) {
  const cube = new Cube(query.cube);
  const {drilldowns, measures} = query.params;

  const timeLevel = Array.from(cube.levelIterator)
    .find(level =>
      drilldowns.some(drilldown => isTimeLevel(level) && isMatchingLevel(drilldown, level))
    );

  // Bail if the query doesn't have a time dimension
  if (!timeLevel) return "";

  const captionId = getColumnId(timeLevel.caption, query.dataset);

  const periodSet = measures.map(({measure}) => {
    const timeMembers = new Set(
      // Prevent empty charts by getting only time members where
      // the measure has an useful value
      // eslint-disable-next-line eqeqeq
      query.dataset.filter(d => d[measure] != 0).map(d => ''.concat(d[captionId]))
    );
    return findHigherCurrentPeriod([...timeMembers]);
  });

  // Return lowest common period
  return periodSet.sort()[0];
}
