import {Chip, Flex} from "@mantine/core";
import React, {useMemo} from "react";
import {CubePicker} from "./CubePicker";
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

export function QueryManager() {
  const {currentQuery, setCurrentQuery, updateQuery} = useQueries();

  const {cubes, dataLocale} = useTesseract();

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
      <CubePicker
        locale={dataLocale}
        onChange={setCurrentQuery}
        options={cubes}
        selected={currentQuery?.cube}
        size="xs"
      />
      {levels}
    </Flex>
  );
}
