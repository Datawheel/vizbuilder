import {saveElement} from "d3plus-export";
import {BarChart, Donut, Geomap, LinePlot, Pie, StackedArea, Treemap} from "d3plus-react";
import React, {useCallback, useMemo, useRef} from "react";
import {createChartConfig} from "../toolbox/chartConfigs";
import {useTranslation} from "../toolbox/useTranslation";
import {Button} from "./Button";
import {DownloadButton} from "./DownloadButton";
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
 * @property {string} currentChart The key of the currently selected chart.
 * @property {[string, string]} currentPeriod The currently selected time period.
 * @property {string[]} [downloadFormats] A list of the currently enabled formats to download. Options are "PNG" and "SVG".
 * @property {boolean} isSingleChart The view has other charts, but the user is enlarging this one.
 * @property {boolean} isUniqueChart The view only has this chart.
 * @property {(measure: OlapClient.Measure) => VizBldr.D3plusConfig} measureConfig A dictionary of custom defined d3plus configs by measure name. Has priority over all other configs.
 * @property {(periodLeft: string, periodRight?: string) => void} onPeriodChange A handler for when the user selects a different time period on the timeline of a chart.
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

  const {translate} = useTranslation();

  const nodeRef = useRef();

  const ChartComponent = chartComponents[chart.chartType];

  const config = useMemo(() => createChartConfig(chart, {
    currentChart,
    isSingleChart,
    isUniqueChart,
    measureConfig: props.measureConfig,
    showConfidenceInt: Boolean(props.showConfidenceInt),
    translate,
    userConfig: props.userConfig || {}
  }), [isSingleChart, isUniqueChart]);

  const saveChart = useCallback(format => {
    const chartInstance = nodeRef.current;
    if (chartInstance) {
      const svgElement = chartInstance.container.querySelector("svg");

      const filename = (config.title instanceof Function
        // If title is a Function, it means that the title is dependent upon the filtered data.
        // Because d3plus handles this generation internally, we need to generate title again using the viz's
        // internal '_filteredData' variable as its param
        ? config.title(chartInstance.viz._filteredData)
        : config.title)
        // and replace special characters with underscores
        .replace(/[^\w]/g, "_")
        .replace(/[_]+/g, "_");

      const getBackground = node => {
        if (node.nodeType !== Node.ELEMENT_NODE) return "white";
        const styles = window.getComputedStyle(node);
        const color = styles.getPropertyValue("background-color");
        return color && color !== "rgba(0, 0, 0, 0)" && color !== "transparent"
          ? color
          : getBackground(node.parentNode);
      };

      saveElement(svgElement, {filename, type: format.toLowerCase()}, {
        background: getBackground(svgElement)
      });
    }
  }, [config]);

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
        {props.downloadFormats && <DownloadButton
          formats={props.downloadFormats}
          onClick={saveChart}
        />}
      </aside>
      <ErrorBoundary>
        <ChartComponent ref={nodeRef} className="vb-chart-viz" config={config} />
      </ErrorBoundary>
    </div>
  );
};
