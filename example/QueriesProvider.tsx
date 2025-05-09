import {useLocalStorage} from "@mantine/hooks";
import {clamp} from "lodash-es";
import React, {createContext, useContext, useEffect, useMemo} from "react";
import type {TesseractCube} from "../src/schema";
import { castArray } from "../src/toolbox/array";

export interface RequestParams {
  key: string;
  cube: string;
  drilldowns: string[];
  measures: string[];
}

interface QueriesContextValue {
  readonly queries: RequestParams[];
  readonly currentQuery?: RequestParams;
  setCurrentQuery(key: string): void;
  clearQueries(): void;
  createQuery(key: string): void;
  updateQuery(key: string, params: Partial<RequestParams>): void;
  deleteQuery(key: string): void;
}

const QueriesContext = createContext<QueriesContextValue | undefined>(undefined);

export function QueriesProvider(props: {
  children: React.ReactNode;
  cubes: Record<string, TesseractCube>;
}) {
  const [index, setIndex] = useLocalStorage({
    key: "QueriesProvider:index",
    getInitialValueInEffect: false,
    defaultValue: 0,
  });

  const [items, setItems] = useLocalStorage({
    key: "QueriesProvider:items",
    getInitialValueInEffect: false,
    defaultValue: Object.keys(props.cubes).length
      ? ([randomRequestParams()] as RequestParams[])
      : [],
  });

  const value = useMemo((): QueriesContextValue => {
    return {
      queries: items,
      currentQuery: items[clamp(index, 0, items.length - 1)],
      setCurrentQuery(key: string) {
        const index = items.findIndex(item => item.key === key);
        if (index > -1) setIndex(index);
        else {
          setIndex(items.length);
          setItems([...items, emptyRequestParams(key)]);
        }
      },
      clearQueries() {
        setItems([]);
        setIndex(-1);
      },
      createQuery(key: string) {
        setItems([...items, emptyRequestParams(key)]);
        setIndex(items.length);
      },
      updateQuery(key: string, params: Partial<RequestParams>) {
        const index = items.findIndex(item => item.key === key);
        if (index > -1) {
          const obj = {...items[index], ...params, key};
          setItems(items.map(item => (item.key === key ? obj : item)));
        }
      },
      deleteQuery(key: string) {
        const obj = items.find(item => item.key === key);
        if (obj) setItems(items.filter(item => item !== obj));
        if (obj === items[index]) setIndex(0);
      },
    };
  }, [index, items, setIndex, setItems]);

  // Mirror current RequestParams to URLSearchParams
  useEffect(() => {
    const currRequest = Object.fromEntries(
      new URLSearchParams(window.location.search),
    ) as unknown as RequestParams;
    const nextRequest = value.currentQuery;
    if (nextRequest && !isSameRequest(currRequest, nextRequest)) {
      const search = new URLSearchParams({
        cube: nextRequest.cube,
        drilldowns: nextRequest.drilldowns.join(","),
        measures: nextRequest.measures.join(","),
      });
      const url = new URL(`?${search.toString()}`, location.href);
      window.history.pushState(value.currentQuery, "", url);
    }
  }, [value.currentQuery]);

  return (
    <QueriesContext.Provider value={value}>{props.children}</QueriesContext.Provider>
  );

  function emptyRequestParams(cubeName: string): RequestParams {
    const cube = props.cubes[cubeName];
    return {
      key: cube.name,
      cube: cube.name,
      drilldowns: [],
      measures: cube.measures.map(item => item.name),
    };
  }

  function randomRequestParams(): RequestParams {
    const cubes = Object.values(props.cubes);
    const cube = cubes[Math.floor(Math.random() * cubes.length)];
    return emptyRequestParams(cube.name);
  }
}

export function useQueries() {
  const value = useContext(QueriesContext);
  if (value == null) {
    throw new Error("Hook useQueries must be used inside a QueriesProvider node.");
  }
  return value;
}

function isSameRequest(a: RequestParams, b: RequestParams): boolean {
  return (
    a.cube === b.cube &&
    standardizeArray(a.drilldowns || []) === standardizeArray(b.drilldowns || []) &&
    standardizeArray(a.measures || []) === standardizeArray(b.measures || [])
  );
}

function standardizeArray(array: string[]) {
  return castArray(array).toString().split(",").sort().toString();
}
