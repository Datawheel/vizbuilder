import {
  ActionIcon,
  Button,
  Chip,
  Divider,
  Flex,
  Group,
  Loader,
  MediaQuery,
  rem,
  Select,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";
import {IconBug, IconChartBar, IconCube} from "@tabler/icons-react";
import React, {useCallback, useMemo} from "react";
import {getAnnotation} from "../src/toolbox/tesseract";
import {FullscreenSearch} from "./FullscreenSearch";
import {useQueries} from "./QueriesProvider";
import {useTesseract} from "./TesseractProvider";

const COLORS = [
  "grape",
  "red",
  "pink",
  "blue",
  "violet",
  "indigo",
  "lime",
  "cyan",
  "green",
  "teal",
  "yellow",
  "orange",
];

export function Toolbar(props: {
  mode: string;
  setMode: (value: string) => void;
  loading?: boolean;
}) {
  const {mode, setMode, loading} = props;

  const {currentQuery, setCurrentQuery, updateQuery} = useQueries();
  const {cubes, dataLocale, availableDataLocale, setDataLocale} = useTesseract();

  const cube = currentQuery ? cubes[currentQuery.cube] : undefined;

  const handleLevelClick = useCallback(
    (
      dimensionName: string,
      hierarchyName: string,
      levelName: string,
      isActive: boolean,
    ) => {
      if (!cube || !currentQuery) return;

      let nextDrilldowns = [...currentQuery.drilldowns];

      if (isActive) {
        nextDrilldowns = nextDrilldowns.filter(item => item !== levelName);
      } else {
        // Find levels of the same dimension but different hierarchy
        const dimension = cube.dimensions.find(d => d.name === dimensionName);
        if (dimension) {
          const otherHierarchiesLevels = dimension.hierarchies
            .filter(h => h.name !== hierarchyName)
            .flatMap(h => h.levels.map(l => l.name));

          // Remove levels from other hierarchies of the same dimension
          nextDrilldowns = nextDrilldowns.filter(
            dd => !otherHierarchiesLevels.includes(dd),
          );
        }
        nextDrilldowns.push(levelName);
      }

      updateQuery(cube.name, {drilldowns: nextDrilldowns});
    },
    [cube, currentQuery, updateQuery],
  );

  const dimensionsContent = useMemo(() => {
    if (!cube || !currentQuery) {
      return (
        <Flex align="center" justify="center" h="100%" sx={{flex: 1}}>
          <Text size="sm" color="dimmed" italic>
            Select a cube to start exploring dimensions
          </Text>
        </Flex>
      );
    }

    return (
      <Flex
        direction="row"
        gap="xs"
        sx={{overflowX: "auto", flex: 1, alignItems: "stretch"}}
      >
        {cube.dimensions.map((dimension, i) => {
          const color = COLORS[i % COLORS.length];
          const selectedHierarchy = dimension.hierarchies.find(hierarchy =>
            hierarchy.levels.some(level => currentQuery.drilldowns.includes(level.name)),
          );

          return (
            <React.Fragment key={dimension.name}>
              {i > 0 && <Divider orientation="vertical" mx={4} my={4} />}
              <Stack spacing={2} sx={{minWidth: "max-content", justifyContent: "center"}}>
                <Group spacing={4} noWrap>
                  {dimension.hierarchies.flatMap(hierarchy =>
                    hierarchy.levels.map(level => {
                      const isActive = currentQuery.drilldowns.includes(level.name);
                      const isDisabled =
                        selectedHierarchy && selectedHierarchy !== hierarchy;
                      return (
                        <Chip
                          key={level.name}
                          checked={isActive}
                          disabled={isDisabled}
                          color={color}
                          variant="outline"
                          size="xs"
                          onClick={() =>
                            handleLevelClick(
                              dimension.name,
                              hierarchy.name,
                              level.name,
                              isActive,
                            )
                          }
                          sx={{
                            "& .mantine-Chip-label": {
                              paddingLeft: rem(6),
                              paddingRight: rem(6),
                              height: rem(20),
                              lineHeight: rem(18),
                              fontSize: rem(12),
                            },
                          }}
                        >
                          {level.caption || level.name}
                        </Chip>
                      );
                    }),
                  )}
                </Group>
              </Stack>
            </React.Fragment>
          );
        })}
      </Flex>
    );
  }, [cube, currentQuery, handleLevelClick]);

  return (
    <Flex
      direction="row"
      gap="xs"
      align="center"
      sx={theme => ({
        backgroundColor:
          theme.colorScheme === "dark" ? theme.colors.dark[7] : theme.white,
        borderRadius: theme.radius.sm,
        padding: `${rem(4)} 0.6rem`,
        border: `1px solid ${
          theme.colorScheme === "dark" ? theme.colors.dark[4] : theme.colors.gray[2]
        }`,
      })}
    >
      <ActionIcon
        color={mode === "Vizbuilder" ? "teal" : "grape"}
        size="md"
        variant="light"
        value={mode}
        onClick={() => setMode(mode === "Vizbuilder" ? "Vizdebugger" : "Vizbuilder")}
      >
        {mode === "Vizbuilder" ? <IconChartBar /> : <IconBug />}
      </ActionIcon>

      <Divider orientation="vertical" />

      <FullscreenSearch
        list={Object.values(cubes)}
        locale={dataLocale}
        onSelect={cube => setCurrentQuery(cube.name)}
      >
        <MediaQuery largerThan="sm" styles={{display: "none"}}>
          <ActionIcon color="blue" size="md" variant="filled">
            <IconCube size={rem(20)} />
          </ActionIcon>
        </MediaQuery>

        <MediaQuery smallerThan="sm" styles={{display: "none"}}>
          <Tooltip
            label={
              cube && (
                <Stack spacing={0} maw={200}>
                  <Text size="sm" lineClamp={2} truncate>
                    {getAnnotation(cube, "table", dataLocale) || cube.caption}
                  </Text>
                  <Text size="xs" color="dimmed" truncate>
                    {cube.name}
                  </Text>
                </Stack>
              )
            }
            withArrow
          >
            <Button size="xs" leftIcon={<IconCube size={rem(16)} />}>
              Cube
            </Button>
          </Tooltip>
        </MediaQuery>
      </FullscreenSearch>

      <Select
        size="xs"
        variant="unstyled"
        data={availableDataLocale}
        value={dataLocale}
        onChange={setDataLocale}
        styles={{
          root: {
            padding: 2,
            minHeight: rem(24),
            width: 46,
            whiteSpace: "nowrap",
          },
          input: {
            paddingLeft: rem(4),
            paddingRight: rem(16),
            textAlign: "center",
            textTransform: "uppercase",
          },
          rightSection: {
            width: rem(16),
          },
          dropdown: {
            width: "60px !important",
            textTransform: "uppercase",
          },
        }}
      />

      <Divider orientation="vertical" />

      {dimensionsContent}

      {loading && <Loader variant="dots" />}
    </Flex>
  );
}
