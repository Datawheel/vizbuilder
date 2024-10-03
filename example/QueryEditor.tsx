import {MultiSelect, Select} from "@mantine/core";
import React, {useCallback, useMemo, useRef, useState} from "react";
import type {TesseractDimension} from "../src/schema";
import type {DrilldownItem, QueryParams} from "../src/structs";
import {emptyQueryParams, useTesseract} from "./TesseractProvider";

export function QueryEditor(props: {
  query: QueryParams;
  onChange: (params: Partial<QueryParams> & {key: string}) => void;
}) {
  const {query} = props;

  const {cubes} = useTesseract();

  const cubeOptions = useMemo(
    () =>
      Object.keys(cubes).map(value => {
        const cube = cubes[value];
        return {value, label: cube.caption, cube};
      }),
    [cubes],
  );

  const cube = cubes[query.cube] || Object.values(cubes)[0];

  const measureOptions = useMemo(
    () => cube.measures.map(measure => ({label: measure.caption, value: measure.name})),
    [cube],
  );

  return (
    <form className="query-builder">
      <ol>
        <li>
          <Select
            label="Cube"
            data={cubeOptions}
            value={query.cube || ""}
            searchable
            onChange={cube => {
              if (!cube) {
                console.error("No cube selected");
              } else if (query.cube === cube) {
                console.log("Same cube selected");
              } else {
                props.onChange({...emptyQueryParams(), key: query.key, cube});
              }
            }}
          />
        </li>
        <li>
          <MultiSelect
            label="Measures"
            data={measureOptions}
            value={query.measures.map(i => i.measure)}
            onChange={values => {
              props.onChange({
                key: query.key,
                measures: values.map(item => ({measure: item})),
              });
            }}
          />
        </li>
        <li>
          <SelectLevels
            dimensions={cube.dimensions}
            onChange={value => {
              console.log(value);
              props.onChange({key: query.key, drilldowns: value});
            }}
          />
        </li>
      </ol>
      <style>{`
form.query-builder ol {
  list-style: none;
  padding: 0;
}
form.query-builder li {
  margin-bottom: 0.5rem;
  line-height: 1.5rem;
}
`}</style>
    </form>
  );
}

function SelectLevels(props: {
  dimensions: TesseractDimension[];
  onChange: (value: DrilldownItem[]) => void;
}) {
  const {dimensions, onChange} = props;

  const [value, setValue] = useState<string[]>([]);

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
      setValue(filteredValues.map(item => item.value));
      onChange(
        filteredValues.map(item => ({
          caption: item.level.caption,
          dimension: item.dimension.name,
          hierarchy: item.hierarchy.name,
          level: item.level.name,
          properties: [],
        })),
      );
    },
    [onChange, options],
  );

  return (
    <MultiSelect label="Levels" data={options} value={value} onChange={changeHandler} />
  );
}
