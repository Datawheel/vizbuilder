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
import {useTranslation} from "./TranslationProvider";
import {useD3plusConfig} from "./useD3plusConfig";
import {useVizbuilderContext} from "./VizbuilderProvider";

const iconByFormat = {
  jpg: IconPhotoDown,
  png: IconPhotoDown,
  svg: IconVectorTriangle,
};

export function ChartCard(props: {
  /** The information needed to build a specific chart configuration. */
  chart: Chart;

  /** Flag to render the card in full feature mode. */
  isFullMode?: boolean;

  /**
   * An event handler to call when the user click the 'focus' button.
   * If not defined, the button will not be rendered.
   */
  onFocus?: () => void;

  style?: React.CSSProperties;
}) {
  const {chart, isFullMode, onFocus} = props;
  const {dataset} = chart.datagroup;

  const {translate} = useTranslation();

  const {downloadFormats, ErrorBoundary, showConfidenceInt} = useVizbuilderContext();

  const nodeRef = useRef<HTMLDivElement | null>(null);

  const [ChartComponent, config] = useD3plusConfig(chart, {
    fullMode: !!isFullMode,
    showConfidenceInt,
  });

  const downloadButtons = useMemo(() => {
    if (!config) return null;

    // Sanitize filename for Windows and Unix
    const filename = (
      typeof config.title === "function" ? config.title(dataset) : config.title || ""
    )
      .replace(/[^\w]/g, "_")
      .replace(/[_]+/g, "_");

    return downloadFormats.map(format => {
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

  if (!ChartComponent || !config) return null;

  const height = isFullMode ? "calc(100vh - 3rem)" : 300;

  return (
    <ErrorBoundary>
      <Paper w="100%" style={{height, ...props.style}}>
        <Stack spacing="xs" p="xs" style={{position: "relative"}} h="100%" w="100%">
          <Group position="right" spacing="xs" align="center">
            {downloadButtons}
            {onFocus && focusButton}
          </Group>
          <Box
            style={{flex: "1 1 auto", height: 10}}
            ref={nodeRef}
            sx={{"& > .viz": {height: "100%"}}}
          >
            <ChartComponent config={config} />
          </Box>
        </Stack>
      </Paper>
    </ErrorBoundary>
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
