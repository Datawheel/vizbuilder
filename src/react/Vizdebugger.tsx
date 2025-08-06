import {
  AspectRatio,
  Button,
  Flex,
  Group,
  Paper,
  ScrollArea,
  SimpleGrid,
  Stack,
  Switch,
  Text,
  Title,
} from "@mantine/core";
import {useDisclosure, useLocalStorage} from "@mantine/hooks";
import {IconReload} from "@tabler/icons-react";
import {mapValues} from "lodash-es";
import React, {useCallback, useMemo} from "react";
import {ObjectInspector, TableInspector} from "react-inspector";

import {type Chart, generateCharts} from "../charts/generator";
import {castArray} from "../toolbox/array";
import {ChartCard} from "./ChartCard";
import {ErrorBoundary} from "./ErrorBoundary";
import {useD3plusConfig} from "./useD3plusConfig";
import type {VizbuilderProps} from "./Vizbuilder";
import {useVizbuilderContext} from "./VizbuilderProvider";

export function Vizdebugger(props: VizbuilderProps) {
  const {
    chartLimits,
    chartTypes,
    datacap,
    getTopojsonConfig,
    NonIdealState,
    ViewErrorComponent,
  } = useVizbuilderContext();

  const datasets = useMemo(() => castArray(props.datasets), [props.datasets]);

  const charts = useMemo(() => {
    return generateCharts(datasets, {
      chartLimits,
      chartTypes,
      datacap,
      getTopojsonConfig,
    });
  }, [datasets, chartLimits, chartTypes, datacap, getTopojsonConfig]);

  const [chartIndex, setChartIndex] = useLocalStorage({
    key: "Vizdebugger:chartIndex",
    getInitialValueInEffect: false,
    defaultValue: 0,
  });

  const refreshChartHandler = useCallback(() => {
    const currentIndex = chartIndex;
    setChartIndex(charts.length + 2);
    setTimeout(() => {
      setChartIndex(currentIndex);
    }, 500);
  }, [chartIndex, charts.length]);

  if (charts.length === 0) {
    if (datasets.length > 0 && datasets[0].data.length === 1) {
      return <NonIdealState status="one-row" />;
    }
    return <NonIdealState status="empty" />;
  }

  const chart = charts[chartIndex];

  return (
    <ErrorBoundary ErrorContent={ViewErrorComponent}>
      <Flex
        style={props.style}
        id={props.id}
        h="100%"
        direction="row"
        align="center"
        wrap="nowrap"
        gap="xs"
      >
        <ScrollArea h="100%" style={{flex: "0 0 140px"}}>
          <Stack m={2} spacing="xs">
            {charts.map((chart, index) => (
              <Paper
                key={chart.key}
                withBorder
                p="xs"
                onClick={() => setChartIndex(index)}
              >
                <Text size="xs">{chart.key}</Text>
                <Text>{chart.type}</Text>
                {chart.type === "barchart" && <Text size="xs">{chart.orientation}</Text>}
              </Paper>
            ))}
          </Stack>
        </ScrollArea>

        {chart && <ChartDebugger chart={chart} onRefresh={refreshChartHandler} />}
      </Flex>
    </ErrorBoundary>
  );
}

function ChartDebugger(props: {chart: Chart; onRefresh: () => void}) {
  const {chart, onRefresh: refreshChartHandler} = props;

  const [fullMode, setFullMode] = useDisclosure(false);

  const [_, chartConfig] = useD3plusConfig(chart, {fullMode});

  const columnInfo = useMemo(() => {
    const {columns, dataset} = chart.datagroup;
    const point = dataset[dataset.length - 1];

    return mapValues(columns, item => {
      if (item.type === "measure") {
        return {
          type: item.type,
          example: point[item.name],
        };
      }
      if (item.type === "property") {
        return {
          type: item.type,
          example: point[item.name],
        };
      }
      if (item.type === "level") {
        return {
          type: item.type,
          isID: item.isID,
          hasID: item.hasID,
          example: point[item.name],
        };
      }
    });
  }, [chart]);

  return (
    <>
      <Stack h="100%" style={{flex: "1 1 50%", overflow: "auto"}}>
        <TitledArea title="columns">
          <TableInspector data={columnInfo} expandLevel={2} />
        </TitledArea>

        <SimpleGrid cols={1} breakpoints={[{minWidth: "60rem", cols: 2, spacing: "xs"}]}>
          <TitledArea title="chart object" withPaper>
            <ObjectInspector data={chart} expandLevel={1} />
          </TitledArea>
          <TitledArea title="d3plus config" withPaper>
            <ObjectInspector data={chartConfig} expandLevel={1} />
          </TitledArea>
        </SimpleGrid>
      </Stack>

      <Stack h="100%" style={{flex: "1 0 50%", overflow: "auto"}}>
        <Flex direction="row" align="center" wrap="nowrap" gap="sm">
          <Group spacing="xs">
            <Button
              size="sm"
              leftIcon={<IconReload size="1.125rem" />}
              variant="default"
              onClick={refreshChartHandler}
            >
              Refresh
            </Button>
          </Group>
          <Switch label="Featured" checked={fullMode} onChange={setFullMode.toggle} />
        </Flex>

        <AspectRatio ratio={4 / 3} w="100%">
          <ChartCard chart={chart} isFullMode={fullMode} style={{height: "100%"}} />
        </AspectRatio>
      </Stack>
    </>
  );
}

function TitledArea(props: {
  title: string;
  children: React.ReactNode;
  withPaper?: boolean;
}) {
  return (
    <div>
      <Title order={3} size="sm">
        {props.title}
      </Title>
      {props.withPaper ? (
        <Paper p="xs" withBorder>
          {props.children}
        </Paper>
      ) : (
        props.children
      )}
    </div>
  );
}
