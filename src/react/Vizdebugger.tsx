import {
  ActionIcon,
  AspectRatio,
  Box,
  Group,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Switch,
  Text,
  Title,
} from "@mantine/core";
import {useDisclosure, useLocalStorage} from "@mantine/hooks";
import {IconWindowMaximize} from "@tabler/icons-react";
import {mapValues} from "lodash-es";
import React, {forwardRef, useCallback, useMemo} from "react";
import {ObjectInspector} from "react-inspector";

import {type Chart, generateCharts} from "../charts/generator";
import {castArray} from "../toolbox/array";
import {ChartCard} from "./ChartCard";
import type {VizbuilderProps} from "./Vizbuilder";
import {useVizbuilderContext} from "./VizbuilderProvider";
import {useD3plusConfig} from "./useD3plusConfig";

export function Vizdebugger(props: VizbuilderProps) {
  const {datasets} = props;

  const {chartLimits, chartTypes, datacap, getTopojsonConfig} = useVizbuilderContext();

  const charts = useMemo(
    () =>
      generateCharts(castArray(datasets), {
        chartLimits,
        chartTypes,
        datacap,
        getTopojsonConfig,
      }),
    [datasets, chartLimits, chartTypes, datacap, getTopojsonConfig],
  );

  const chartOptions = useMemo(
    () =>
      charts.map((chart, index) => ({
        chart,
        label: `${chart.key} - ${chart.values.measure.name}`,
        value: `${index}`,
      })),
    [charts],
  );

  const [fullMode, setFullMode] = useDisclosure(false);

  const [showConfidenceInt, setShowConfidenceInt] = useDisclosure(true);

  const [chartIndex, setChartIndex] = useLocalStorage({
    key: "Vizdebugger:chartIndex",
    getInitialValueInEffect: false,
    defaultValue: "0",
  });

  const chart = charts[chartIndex];

  const columnInfo = useMemo(() => {
    if (!castArray(props.datasets).length) return [];
    const {columns, data, locale} = Array.isArray(props.datasets)
      ? props.datasets[0]
      : props.datasets;
    const point = data[data.length - 1];
    return mapValues(columns, item => {
      if (item.type === "measure") {
        return {
          type: item.type,
          entities: [item.parentMeasure, item.measure],
          example: point[item.name],
        };
      }
      if (item.type === "property") {
        return {
          type: item.type,
          entities: [item.dimension, item.hierarchy, item.level, item.property],
          example: point[item.name],
        };
      }
      if (item.type === "level") {
        return {
          type: item.type,
          isID: item.isID,
          hasID: item.hasID,
          entities: [item.dimension, item.hierarchy, item.level],
          example: point[item.name],
        };
      }
    });
  }, [props.datasets]);

  return (
    <Group grow h="100%">
      <Box h="100%" style={{overflow: "auto"}}>
        <SimpleGrid cols={2}>
          <div>
            <Title order={3} mb="xs">
              Columns
            </Title>
            <Paper shadow="xs" p="xs">
              <ObjectInspector data={columnInfo} expandLevel={2} />
            </Paper>
          </div>

          {chart && (
            <ChartConfigInspector
              chart={chart}
              fullMode={fullMode}
              showConfidenceInt={showConfidenceInt}
            />
          )}
        </SimpleGrid>

        <Title order={3} mt="lg" mb="xs">
          All generated charts
        </Title>
        <SimpleGrid cols={3}>
          {charts.map((chart, index) => (
            <Paper key={chart.key} shadow="xs" p="xs" pos="relative">
              <ObjectInspector data={chart} expandLevel={1} />
              <ActionIcon
                sx={{position: "absolute", right: 0, bottom: 0, margin: "0.25rem"}}
                size="xs"
                onClick={() => setChartIndex(`${index}`)}
              >
                <IconWindowMaximize />
              </ActionIcon>
            </Paper>
          ))}
        </SimpleGrid>
      </Box>

      <Stack h="100%">
        <Group grow>
          <Select
            data={chartOptions}
            itemComponent={ChartItem}
            onChange={useCallback(
              (value: string | null) => setChartIndex(value || "0"),
              [],
            )}
            value={chartIndex}
          />
          <Switch label="Featured" checked={fullMode} onChange={setFullMode.toggle} />
          <Switch
            label="Confidence Interval"
            checked={showConfidenceInt}
            onChange={setShowConfidenceInt.toggle}
          />
        </Group>

        {chart && (
          <AspectRatio ratio={4 / 3} w="100%">
            <ChartCard
              chart={chart}
              isFullMode={fullMode}
              style={{height: "100%"}}
            />
          </AspectRatio>
        )}
      </Stack>
    </Group>
  );
}

function ChartConfigInspector(props: {
  chart: Chart;
  fullMode: boolean;
  showConfidenceInt: boolean;
}) {
  const {chart, fullMode, showConfidenceInt} = props;
  const [_, chartConfig] = useD3plusConfig(chart, {fullMode, showConfidenceInt});
  return (
    <div>
      <Title order={3} mb="xs">
        d3plus config
      </Title>
      <Paper shadow="xs" p="xs">
        <ObjectInspector data={chartConfig} expandLevel={1} />
      </Paper>
    </div>
  );
}

const ChartItem = forwardRef<
  HTMLDivElement,
  {label: string; value: string; chart: Chart}
>((props, ref) => {
  const {chart, label, value, ...others} = props;
  const drilldowns = castArray(chart.series)
    .map(series => series.level.name)
    .join(", ");
  return (
    <div ref={ref} {...others}>
      <Text>{`${chart.type}: ${chart.key}`}</Text>
      <Text size="xs">{`${chart.values.measure.name} [${chart.values.measure.aggregator}] - ${drilldowns}`}</Text>
    </div>
  );
});
