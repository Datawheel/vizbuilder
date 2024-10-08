import {Box, Button, Group, Paper, Stack} from "@mantine/core";
import {
  IconArrowsMaximize,
  IconArrowsMinimize,
  IconDownload,
  IconPhotoDown,
  IconVectorTriangle,
} from "@tabler/icons-react";
import {saveElement} from "d3plus-export";
import {BarChart, Donut, Geomap, LinePlot, Pie, StackedArea, Treemap} from "d3plus-react";
import React, {useMemo, useRef} from "react";
import type {TesseractMeasure} from "../schema";
import type {ChartType, D3plusConfig} from "../structs";
import {castArray} from "../toolbox/array";
import {createChartConfig} from "../toolbox/chartConfigs";
import type {Chart} from "../toolbox/charts";
import {useTranslation} from "../toolbox/translation";
import {ErrorBoundary} from "./ErrorBoundary";

type D3plusComponent = React.ComponentType<{config: D3plusConfig}>;

export const chartComponents: Record<ChartType, D3plusComponent> = {
  barchart: BarChart,
  donut: Donut,
  geomap: Geomap,
  histogram: BarChart,
  lineplot: LinePlot,
  pie: Pie,
  stacked: StackedArea,
  treemap: Treemap,
};

const iconByFormat = {
  jpg: IconPhotoDown,
  png: IconPhotoDown,
  svg: IconVectorTriangle,
};

/** */
export function ChartCard(props: {
  /** The information needed to build a specific chart configuration. */
  chart: Chart;
  /** The key of the chart currently focused by the user. */
  currentChart: string;
  /** A list of the currently enabled formats to download. Options are "PNG" and "SVG". */
  downloadFormats?: string[];
  /** Specifies if the view has other charts, but the user is focusing this one. */
  isSingleChart: boolean;
  /**
   * An accessor that generates custom defined d3plus configs by measure name.
   * Has priority over all other configs.
   */
  measureConfig: (measure: TesseractMeasure) => D3plusConfig;
  /** A handler for when the user selects a specific chart. */
  onToggle: () => void;
  /** Toggles confidence intervals/margins of error when available. */
  showConfidenceInt: boolean;
  /**
   * A global d3plus config that gets applied on all charts.
   * Has priority over the individually generated configs per chart,
   * but can be overridden by internal working configurations.
   */
  userConfig: D3plusConfig;
}) {
  const {chart, currentChart, isSingleChart} = props;
  const isFocused = currentChart === chart.key;

  const {translate, locale} = useTranslation();

  const nodeRef = useRef<HTMLDivElement | null>(null);

  const ChartComponent = chartComponents[chart.chartType];

  const config = useMemo(
    () =>
      createChartConfig(chart, {
        currentChart,
        isSingleChart,
        isUniqueChart: isSingleChart,
        measureConfig: props.measureConfig,
        showConfidenceInt: Boolean(props.showConfidenceInt),
        translate,
        userConfig: props.userConfig || {},
      }),
    [isSingleChart],
  );

  const downloadButtons = useMemo(() => {
    if (!isFocused && !isSingleChart) return [];

    const filename = (config.title instanceof Function ? config.title() : config.title)
      // and replace special characters with underscores
      .replace(/[^\w]/g, "_")
      .replace(/[_]+/g, "_");

    return castArray(props.downloadFormats).map(format => {
      const formatLower = format.toLowerCase();
      const Icon = iconByFormat[formatLower] || IconDownload;
      return (
        <Button
          compact
          key={format}
          leftIcon={<Icon size={16} />}
          onClick={() => {
            const {current: boxElement} = nodeRef;
            const svgElement = boxElement?.querySelector("svg");
            if (svgElement) {
              saveElement(
                svgElement,
                {filename, type: formatLower},
                {background: getBackground(svgElement)},
              );
            }
          }}
          size="sm"
          variant="light"
        >
          {format.toUpperCase()}
        </Button>
      );
    });
  }, [isFocused, isSingleChart, props.downloadFormats]);

  const focusButton = useMemo(() => {
    if (!isFocused && isSingleChart) return null;

    const Icon = isFocused ? IconArrowsMinimize : IconArrowsMaximize;
    return (
      <Button
        compact
        leftIcon={<Icon size={16} />}
        onClick={props.onToggle}
        size="sm"
        variant={isFocused ? "filled" : "light"}
      >
        {isFocused ? translate("action_close") : translate("action_enlarge")}
      </Button>
    );
  }, [isFocused, isSingleChart, locale, props.onToggle]);

  const height = isFocused ? "calc(100vh - 3rem)" : isSingleChart ? "75vh" : 300;

  return (
    <Paper h={height} w="100%" style={{overflow: "hidden"}}>
      <ErrorBoundary>
        <Stack spacing={0} h={height} style={{position: "relative"}} w="100%">
          <Group position="right" p="xs" spacing="xs" align="center">
            {downloadButtons}
            {focusButton}
          </Group>
          <Box style={{flex: "1 1 auto"}} ref={nodeRef} pb="xs" px="xs">
            <ChartComponent config={config} />
          </Box>
        </Stack>
      </ErrorBoundary>
    </Paper>
  );
}

const getBackground = node => {
  if (node.nodeType !== Node.ELEMENT_NODE) return "white";
  const styles = window.getComputedStyle(node);
  const color = styles.getPropertyValue("background-color");
  return color && color !== "rgba(0, 0, 0, 0)" && color !== "transparent"
    ? color
    : getBackground(node.parentNode);
};
