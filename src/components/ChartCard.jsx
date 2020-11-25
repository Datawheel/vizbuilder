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
import {useTranslation} from "../toolbox/translation";
import {Button} from "./Button";
import {ErrorBoundary} from "./ErrorBoundary";

/** @type {Record<VizBldr.ChartType, React.ElementType>} */
const chartComponents = {
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
 * @property {VizBldr.Struct.Chart} chart
 * @property {string} currentChart
 * @property {number} currentPeriod
 * @property {boolean} isSingleChart
 * @property {boolean} isUniqueChart
 * @property {(period: Date) => void} onPeriodChange
 * @property {() => void} onToggle
 * @property {boolean} showConfidenceInt
 * @property {any} userConfig
 */

/** @type {React.FC<ChartCardProps>} */
export const ChartCard = ({
  chart,
  currentChart,
  currentPeriod,
  isSingleChart,
  isUniqueChart,
  onPeriodChange,
  onToggle,
  showConfidenceInt,
  userConfig
}) => {
  const {locale, translate} = useTranslation();

  const ChartComponent = chartComponents[chart.chartType];

  const config = useMemo(() => createChartConfig(chart, {
    currentChart,
    currentPeriod,
    isSingleChart,
    isUniqueChart,
    locale,
    showConfidenceInt,
    translate,
    onPeriodChange,
    userConfig
  }), [isSingleChart, isUniqueChart, locale]);

  const focused = currentChart === chart.key;
  const buttonIcon = focused ? "cross" : "zoom-in";
  const buttonText = focused ? translate("action_close") : translate("action_enlarge");

  return (
    <ErrorBoundary>
      <div className="vb-chart-card">
        {!isUniqueChart && <aside className="vb-chart-toolbar">
          <Button minimal icon={buttonIcon} text={buttonText} onClick={onToggle} />
        </aside>}
        <ChartComponent className="vb-chart-viz" config={config} />
      </div>
    </ErrorBoundary>
  );
};
