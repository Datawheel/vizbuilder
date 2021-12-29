import flatMap from "lodash/flatMap";
import {useMemo, useState} from "react";
import {chartComponents} from "../components/ChartCard";
import {asArray} from "./array";
import {DEFAULT_CHART_LIMITS} from "./chartLimits";
import {chartRemixer} from "./charts";
import {buildDatagroup} from "./datagroup";
import {normalizeTopojsonConfig} from "./props";

/**
 * @param {VizBldr.VizbuilderProps} props
 */
export const useCharts = props => {
  const [currentChart, setCurrentChart] = useState("");
  
  const charts = useMemo(() => {
    const allowedChartTypes = props.allowedChartTypes || Object.keys(chartComponents);
    const datagroupProps = {
      datacap: props.datacap || 20000,
      getTopojsonConfig: normalizeTopojsonConfig(props.topojsonConfig)
    };
    const chartLimits = {...DEFAULT_CHART_LIMITS, ...(props.chartLimits || {})};

    return flatMap(asArray(props.queries), query => {
      const datagroup = buildDatagroup(query, datagroupProps);
      return flatMap(allowedChartTypes, chartType => chartRemixer(datagroup, chartType, chartLimits));
    });
  }, [props.queries, props.chartLimits]);

  return {currentChart, setCurrentChart, charts};
};
