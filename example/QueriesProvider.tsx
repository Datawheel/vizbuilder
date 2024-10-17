import {useLocalStorage} from "@mantine/hooks";
import {clamp} from "lodash-es";
import React, {createContext, useContext, useMemo} from "react";
import type {TesseractCube} from "../src/schema";

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
    defaultValue: [randomRequestParams()] as RequestParams[],
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
