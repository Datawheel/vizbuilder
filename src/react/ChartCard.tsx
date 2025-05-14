import {Box, Button, Group, Paper, Stack} from "@mantine/core";
import {
  IconArrowsMaximize,
  IconArrowsMinimize,
  IconDownload,
  IconPhotoDown,
  IconVectorTriangle,
} from "@tabler/icons-react";
import {saveElement} from "d3plus-export";
import React, {useMemo, useRef} from "react";
import type {Chart} from "../charts/generator";
import type {D3plusConfig} from "../d3plus";
import type {TesseractMeasure} from "../schema";
import {castArray} from "../toolbox/array";
import {ErrorBoundary} from "./ErrorBoundary";
import {useTranslation} from "./TranslationProvider";
import {useD3plusConfig} from "./useD3plusConfig";

const iconByFormat = {
  jpg: IconPhotoDown,
  png: IconPhotoDown,
  svg: IconVectorTriangle,
};

export function ChartCard(props: {
  /** The information needed to build a specific chart configuration. */
  chart: Chart;

  /**
   * An accessor that generates custom defined d3plus configs by measure name.
   * Has priority over all other configs.
   */
  measureConfig: (measure: TesseractMeasure) => Partial<D3plusConfig>;

  /** A list of the currently enabled formats to download. Options are "PNG" and "SVG". */
  downloadFormats?: string[];

  /** Flag to render the card in full feature mode. */
  isFullMode?: boolean;

  /**
   * An event handler to call when the user click the 'focus' button.
   * If not defined, the button will not be rendered.
   */
  onFocus?: () => void;

  /** Toggles confidence intervals/margins of error when available. */
  showConfidenceInt?: boolean;

  /**
   * A global d3plus config that gets applied on all charts.
   * Has priority over the individually generated configs per chart,
   * but can be overridden by internal working configurations.
   */
  userConfig?: (chart: Chart) => Partial<D3plusConfig>;
}) {
  const {chart, downloadFormats, isFullMode, onFocus, showConfidenceInt} = props;
  const {dataset} = chart.datagroup;

  const {translate} = useTranslation();

  const nodeRef = useRef<HTMLDivElement | null>(null);

  const [ChartComponent, config] = useD3plusConfig(chart, {
    fullMode: !!isFullMode,
    showConfidenceInt: !!showConfidenceInt,
    getMeasureConfig: props.measureConfig,
    t: translate,
  });

  const downloadButtons = useMemo(() => {
    // Sanitize filename for Windows and Unix
    const filename = (
      typeof config.title === "function" ? config.title(dataset) : config.title || ""
    )
      .replace(/[^\w]/g, "_")
      .replace(/[_]+/g, "_");

    return castArray(downloadFormats).map(format => {
      const formatLower = format.toLowerCase();
      const Icon = iconByFormat[formatLower] || IconDownload;
      return (
        <Button
          key={format}
          compact
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
  }, [config, dataset, downloadFormats]);

  const focusButton = useMemo(() => {
    const Icon = isFullMode ? IconArrowsMinimize : IconArrowsMaximize;
    return (
      <Button
        compact
        leftIcon={<Icon size={16} />}
        onClick={onFocus}
        size="sm"
        variant={isFullMode ? "filled" : "light"}
      >
        {isFullMode ? translate("action_close") : translate("action_enlarge")}
      </Button>
    );
  }, [isFullMode, translate, onFocus]);

  const height = isFullMode ? "calc(100vh - 3rem)" : 300;

  if (!ChartComponent) return null;

  return (
    <Paper h={height} w="100%" style={{overflow: "hidden"}}>
      <ErrorBoundary>
        <Stack spacing={0} h={height} style={{position: "relative"}} w="100%">
          <Group position="right" p="xs" spacing="xs" align="center">
            {downloadButtons}
            {onFocus && focusButton}
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
