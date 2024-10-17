import {Chip, Flex, Select, Text} from "@mantine/core";
import React, {forwardRef, useMemo} from "react";
import {type TesseractCube, getAnnotation} from "../src/schema";
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
  "dark",
  "gray",
];

// TODO: offer a fullscreen cube selector
export function QueryManager() {
  const {currentQuery, setCurrentQuery, updateQuery} = useQueries();

  const {cubes, dataLocale} = useTesseract();

  const cubeOptions = useMemo(() => {
    return Object.values(cubes).map(cube => ({label: cube.name, value: cube.name, cube}));
  }, [cubes]);

  const CubeItem = useMemo(
    () =>
      forwardRef<HTMLDivElement, {label: string; value: string; cube: TesseractCube}>(
        (props, ref) => {
          const {cube, label, value, ...others} = props;
          return (
            <div ref={ref} {...others}>
              <Text fw={700}>{cube.name}</Text>
              {[
                getAnnotation(cube, "topic", dataLocale),
                getAnnotation(cube, "subtopic", dataLocale),
                getAnnotation(cube, "table", dataLocale),
              ]
                .filter(Boolean)
                .map(label => (
                  <Text key={label} size="xs" sx={{whiteSpace: "nowrap"}}>
                    {label}
                  </Text>
                ))}
            </div>
          );
        },
      ),
    [dataLocale],
  );

  const levels = useMemo(() => {
    if (!currentQuery) return [];

    const {drilldowns} = currentQuery;
    const cube = cubes[currentQuery.cube];
    const colors = COLORS.slice();
    return cube.dimensions.flatMap(dimension => {
      const selectedHierarchy = dimension.hierarchies.find(hierarchy =>
        hierarchy.levels.some(level => drilldowns.includes(level.name)),
      );
      return dimension.hierarchies.flatMap(hierarchy => {
        const color = colors.shift();
        return hierarchy.levels.flatMap(level => {
          const isActive = currentQuery.drilldowns.includes(level.name);
          const isDisabled = selectedHierarchy && selectedHierarchy !== hierarchy;
          return (
            <Chip
              key={level.name}
              checked={isActive}
              color={color}
              disabled={isDisabled}
              title={level.name}
              onClick={() => {
                updateQuery(cube.name, {
                  drilldowns: isActive
                    ? drilldowns.filter(item => item !== level.name)
                    : [...drilldowns, level.name],
                });
              }}
              variant="outline"
              wrapperProps={{
                title:
                  level.name +
                  (isDisabled
                    ? ` (disabled by hierarchy '${selectedHierarchy.name}')`
                    : ""),
                sx: {
                  "& > label": {
                    maxWidth: 200,
                    overflow: "hidden",
                    "& > span": {
                      minWidth: 18,
                    },
                  },
                },
              }}
            >
              {level.name}
            </Chip>
          );
        });
      });
    });
  }, [currentQuery, cubes, updateQuery]);

  return (
    <Flex style={{flex: "1 0"}} direction="row" align="center" gap="sm">
      <Select
        data={cubeOptions}
        itemComponent={CubeItem}
        onChange={setCurrentQuery}
        searchable
        size="xs"
        styles={{dropdown: {width: 300}}}
        value={currentQuery?.cube}
      />
      {levels}
    </Flex>
  );
}
