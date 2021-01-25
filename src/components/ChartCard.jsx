import {
  BarChart,
  Donut,
  Geomap,
  LinePlot,
  Pie,
  StackedArea,
  Treemap
} from "d3plus-react";
import React, {useMemo} from "react";
import {createChartConfig} from "../toolbox/chartConfigs";
import {useTranslation} from "../toolbox/useTranslation";
import {Button} from "./Button";
import {ErrorBoundary} from "./ErrorBoundary";

/** @type {Record<VizBldr.ChartType, React.ElementType>} */
export const chartComponents = {
  barchart: BarChart,
  barchartyear: BarChart,
  donut: Donut,
  geomap: Geomap,
  histogram: BarChart,
  lineplot: LinePlot,
  pie: Pie,
  stacked: StackedArea,
  treemap: Treemap
};

/**
 * @typedef ChartCardProps
 * @property {VizBldr.Struct.Chart} chart The information needed to build a specific chart configuration.
 * @property {string} currentChart The key of the currently selected chart
 * @property {string} currentPeriod The currently selected time period
 * @property {boolean} isSingleChart The view has other charts, but the user is enlarging this one
 * @property {boolean} isUniqueChart The view only has this chart
 * @property {(measure: import("@datawheel/olap-client").Measure) => VizBldr.D3plusConfig} measureConfig A dictionary of custom defined d3plus configs by measure name. Has priority over all other configs.
 * @property {(period: string) => void} onPeriodChange A handler for when the user selects a different time period on the timeline of a chart.
 * @property {() => void} onToggle A handler for when the user selects a specific chart.
 * @property {VizBldr.VizbuilderProps["showConfidenceInt"]} showConfidenceInt Toggles confidence intervals/margins of error when available.
 * @property {VizBldr.VizbuilderProps["userConfig"]} userConfig A global d3plus config that gets applied on all charts. Has priority over the individually generated configs per chart, but can be overridden by internal working configurations.
 */

/** @type {React.FC<ChartCardProps>} */
export const ChartCard = props => {
  const {
    chart,
    currentChart,
    isSingleChart,
    isUniqueChart
  } = props;

  const {locale, translate} = useTranslation();

  const ChartComponent = chartComponents[chart.chartType];

  const config = useMemo(() => createChartConfig(chart, {
    currentChart,
    currentPeriod: props.currentPeriod,
    isSingleChart,
    isUniqueChart,
    locale,
    measureConfig: props.measureConfig,
    onPeriodChange: props.onPeriodChange,
    showConfidenceInt: Boolean(props.showConfidenceInt),
    translate,
    userConfig: props.userConfig || {}
  }), [isSingleChart, isUniqueChart, locale]);

  const focused = currentChart === chart.key;
  const buttonIcon = focused ? "cross" : "zoom-in";
  const buttonText = focused ? translate("action_close") : translate("action_enlarge");

  return (
    <div className="vb-chart-card">
      <aside className="vb-chart-toolbar">
        {!isUniqueChart && <Button
          icon={buttonIcon}
          minimal
          onClick={props.onToggle}
          text={buttonText}
        />}
      </aside>
      <ErrorBoundary>
        <ChartComponent className="vb-chart-viz" config={config} />
      </ErrorBoundary>
    </div>
  );
};
