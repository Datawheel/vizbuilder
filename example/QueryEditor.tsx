import {Select} from "@mantine/core";
import React, {useCallback, useMemo} from "react";
import type {QueryParams} from "../src/structs";
import {emptyQueryParams, useTesseract} from "./TesseractProvider";

export function QueryEditor(props: {
  query: QueryParams;
  onChange: (params: Partial<QueryParams> & {key: string}) => void;
  onClose: () => void;
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

  const options = useMemo(() => {
    const cube = cubes[query.cube];
    return {
      cubes: Object.keys(cubes),
      dimensions: cube ? cube.dimensions : [],
      measures: cube ? cube.measures : [],
    };
  }, [cubes, query.cube]);

  const submitHandler: React.ChangeEventHandler<HTMLSelectElement> = useCallback(
    evt => {
      const {target} = evt;
      if (target.name === "drilldowns" || target.name === "measures") {
        const value = Array.from(target.selectedOptions, item => item.textContent || "");
        setQueryProp(target.name, value);
      } else if (target.name === "cube") {
        setQueryProp(target.name, target.value);
      }
    },
    [setQueryProp],
  );

  return (
    <form className="query-builder">
      <button type="button" onClick={props.onClose}>
        Close
      </button>
      <fieldset id="query-info">
        <legend>{`Query ${query.key}`}</legend>
        <ol>
          <li>
            <Select
              label="Cube"
              data={cubeOptions}
              value={query.cube}
              onChange={cube => {
                if (cube && query.cube !== cube) {
                  props.onChange({...emptyQueryParams(), key: query.key, cube});
                }
              }}
            />
          </li>
          <li>
            <label>Measures</label>
            <select
              multiple
              name="measures"
              onChange={submitHandler}
              value={query.measures}
            >
              {options.measures.map(item => (
                <option key={item.name} title={item.name}>
                  {item.name}
                </option>
              ))}
            </select>
          </li>
          <li>
            <label>Levels</label>
            <select
              multiple
              name="drilldowns"
              onChange={submitHandler}
              value={query.drilldowns}
            >
              {options.dimensions.flatMap(dim =>
                dim.hierarchies.flatMap(hie => (
                  <optgroup
                    key={hie.fullName}
                    label={hie.fullName}
                    title={hie.name}
                    disabled={query.drilldowns.some(name => name.includes(dim.name))}
                  >
                    {hie.levels.map(lvl => (
                      <option key={lvl.uniqueName} title={lvl.fullName}>
                        {lvl.uniqueName}
                      </option>
                    ))}
                  </optgroup>
                )),
              )}
            </select>
          </li>
        </ol>
      </fieldset>
      <style>{`
form.query-builder ol {
  list-style: none;
  padding: 0;
}
form.query-builder li {
  margin-bottom: 0.5rem;
  line-height: 1.5rem;
}
form.query-builder label {
  display: inline-block;
  vertical-align: top;
  width: 100px;
}
form.query-builder input,
form.query-builder select {
  display: inline-block;
  width: 200px;
}
form.query-builder select[multiple] {
  height: 300px;
}
`}</style>
    </form>
  );
}
