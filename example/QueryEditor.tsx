import type {TesseractDimension, TesseractMeasure} from "@datawheel/logiclayer-client";
import {MultiSelect, Select, Stack, Text} from "@mantine/core";
import React, {useCallback, useMemo, useRef} from "react";
import {getAnnotation} from "../src/toolbox/tesseract";
import type {RequestParams} from "./QueriesProvider";
import {useTesseract} from "./TesseractProvider";

export function QueryEditor(props: {
  params: RequestParams;
  onChange: (params: Partial<RequestParams> & {key: string}) => void;
}) {
  const {params} = props;

  const {cubes, dataLocale} = useTesseract();

  const cubeOptions = useMemo(
    () =>
      Object.keys(cubes).map(value => {
        const cube = cubes[value];
        return {value, label: cube.caption, cube};
      }),
    [cubes],
  );

  const cube = cubes[params.cube] || Object.values(cubes)[0];

  return (
    <Stack h="50vh" justify="space-around">
      <Select
        label="Cube"
        data={cubeOptions}
        value={params.cube || ""}
        searchable
        onChange={cube => {
          if (!cube) {
            console.error("No cube selected");
          } else if (params.cube === cube) {
            console.log("Same cube selected");
          } else {
            console.log("New cube selected", cube);
            props.onChange({key: params.key, cube, drilldowns: [], measures: []});
          }
        }}
      />
      {cube && (
        <Text size="sm">
          <span>{`${getAnnotation(cube, "topic", dataLocale)} > `}</span>
          <span>{`${getAnnotation(cube, "subtopic", dataLocale)} > `}</span>
          <span>{getAnnotation(cube, "table", dataLocale)}</span>
        </Text>
      )}

      <SelectMeasures
        options={cube.measures}
        value={params.measures}
        onChange={value => {
          props.onChange({key: params.key, measures: value.sort()});
        }}
      />

      <SelectLevels
        options={cube.dimensions}
        value={params.drilldowns}
        onChange={value => {
          props.onChange({key: params.key, drilldowns: value.sort()});
        }}
      />
    </Stack>
  );
}

function SelectMeasures(props: {
  onChange: (value: string[]) => void;
  options: TesseractMeasure[];
  value: string[];
}) {
  const {options: measures, onChange} = props;

  const options = useMemo(
    () => measures.map(measure => ({label: measure.caption, value: measure.name})),
    [measures],
  );

  return (
    <MultiSelect
      label="Measures"
      data={options}
      value={props.value}
      onChange={onChange}
    />
  );
}

function SelectLevels(props: {
  onChange: (value: string[]) => void;
  options: TesseractDimension[];
  value: string[];
}) {
  const {options: dimensions, onChange} = props;

  const hierarchyMap = useRef({});

  const options = useMemo(
    () =>
      dimensions.flatMap(dimension => {
        return dimension.hierarchies.flatMap(hierarchy => {
          return hierarchy.levels.map(level => ({
            value: level.name,
            label: level.caption,
            group:
              dimension.caption === hierarchy.caption
                ? dimension.caption
                : `${dimension.caption} > ${hierarchy.caption}`,
            dimension,
            hierarchy,
            level,
          }));
        });
      }),
    [dimensions],
  );

  const changeHandler = useCallback(
    (values: string[]) => {
      const optionMap = Object.fromEntries(options.map(i => [i.value, i]));
      const fullValues = values.map(item => optionMap[item]);

      const mismatch = fullValues.filter(item => {
        const ref = hierarchyMap.current[item.dimension.name];
        return ref && ref !== item.hierarchy.name;
      });
      const mismatchMap = Object.fromEntries(
        mismatch.map(item => [item.dimension.name, item.hierarchy.name]),
      );

      const filteredValues = fullValues.filter(item => {
        const ref = mismatchMap[item.dimension.name];
        return !ref || ref === item.hierarchy.name;
      });

      Object.assign(hierarchyMap.current, mismatchMap);
      onChange(filteredValues.map(item => item.value));
    },
    [onChange, options],
  );

  return (
    <MultiSelect
      label="Levels"
      data={options}
      value={props.value}
      onChange={changeHandler}
    />
  );
}
