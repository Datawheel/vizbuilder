import {Box, Button, Group, Stack} from "@mantine/core";
import {IconArrowsMaximize, IconArrowsMinimize} from "@tabler/icons-react";
import {saveElement} from "d3plus-export";
import {BarChart, Donut, Geomap, LinePlot, Pie, StackedArea, Treemap} from "d3plus-react";
import React, {useCallback, useMemo, useRef} from "react";
import {createChartConfig} from "../toolbox/chartConfigs";
import {useTranslation} from "../toolbox/useTranslation";
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
 * @property {(measure: OlapClient.Measure) => VizBldr.D3plusConfig} measureConfig A dictionary of custom defined d3plus configs by measure name. Has priority over all other configs.
 * @property {() => void} onToggle A handler for when the user selects a specific chart.
 * @property {VizBldr.VizbuilderProps["showConfidenceInt"]} showConfidenceInt Toggles confidence intervals/margins of error when available.
 * @property {VizBldr.VizbuilderProps["userConfig"]} userConfig A global d3plus config that gets applied on all charts. Has priority over the individually generated configs per chart, but can be overridden by internal working configurations.
 */

/** @type {React.FC<ChartCardProps>} */
export const ChartCard = props => {
  const {
    chart,
    currentChart,
    isSingleChart
  } = props;

  const {translate} = useTranslation();

  /** @type {React.MutableRefObject<HTMLDivElement | null>} */
  const nodeRef = useRef(null);

  const ChartComponent = chartComponents[chart.chartType];

  const config = useMemo(() => createChartConfig(chart, {
    currentChart,
    isSingleChart,
    measureConfig: props.measureConfig,
    showConfidenceInt: Boolean(props.showConfidenceInt),
    translate,
    userConfig: props.userConfig || {}
  }), [isSingleChart]);

  const saveChart = useCallback(format => {
    const chartInstance = nodeRef.current;
    if (chartInstance) {
      const svgElement = chartInstance.querySelector("svg");

      const filename = (config.title instanceof Function ? config.title() : config.title)
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
  const ButtonIcon = focused ? IconArrowsMinimize : IconArrowsMaximize;
  const buttonText = focused ? translate("action_close") : translate("action_enlarge");
  const buttonVariant = focused ? "filled" : "light";
  const height = focused ? "calc(100vh - 3rem)" : isSingleChart ? "75vh" : 300;
  const buttonPosition = focused || isSingleChart ? "static" : "absolute";

  return (
    <Box className="vb-chart-card" h={height} miw={200} w="100%" style={{overflow: "hidden"}}>
      <ErrorBoundary>
        <Stack spacing={0} h={height} style={{position: "relative"}} w="100%">
          <Box style={{flex: "1 1 100%"}} className="vb-chart-viz" ref={nodeRef} p="xs">
            <ChartComponent config={config} />
          </Box>
          <Group className="vb-chart-toolbar" position="right" p="xs" spacing="xs" align="center" bottom={0} right={0} style={{position: buttonPosition}}>
            {(focused || isSingleChart) && props.downloadFormats && <DownloadButton
              formats={props.downloadFormats}
              onClick={saveChart}
            />}
            {(!isSingleChart || focused) &&
              <Button
                compact
                leftIcon={<ButtonIcon size={16} />}
                onClick={props.onToggle}
                size="sm"
                variant={buttonVariant}
              >
                {buttonText}
              </Button>
            }
          </Group>
        </Stack>
      </ErrorBoundary>
    </Box>
  );
};
