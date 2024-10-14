import {useLocalStorage} from "@mantine/hooks";
import {clamp} from "lodash";
import React, {createContext, useContext, useMemo, useState} from "react";
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
  createQuery(): void;
  updateQuery(params: Partial<RequestParams> & {key: string}): void;
  deleteQuery(key: string): void;
}

const QueriesContext = createContext<QueriesContextValue | undefined>(undefined);

export function QueriesProvider(props: {
  children: React.ReactNode;
  cubes: Record<string, TesseractCube>;
}) {
  const [index, setIndex] = useState(0);
  const [items, setItems] = useLocalStorage({
    key: "QueriesProvider:items",
    getInitialValueInEffect: false,
    defaultValue: [emptyRequestParams()],
  });

  const value = useMemo((): QueriesContextValue => {
    return {
      queries: items,
      currentQuery: items[clamp(index, 0, items.length - 1)],
      setCurrentQuery(key: string) {
        const index = items.findIndex(item => item.key === key);
        if (index > -1) setIndex(index);
      },
      clearQueries() {
        setItems([emptyRequestParams()]);
        setIndex(0);
      },
      createQuery() {
        const obj = emptyRequestParams();
        setItems([...items, obj]);
        setIndex(items.length);
      },
      updateQuery(params: Partial<RequestParams> & {key: string}) {
        const index = items.findIndex(item => item.key === params.key);
        if (index > -1) {
          const obj = {...items[index], ...params};
          setItems(items.map(item => (item.key === params.key ? obj : item)));
        }
      },
      deleteQuery(key: string) {
        const obj = items.find(item => item.key === key);
        if (obj) setItems(items.filter(item => item !== obj));
        if (obj === items[index]) setIndex(0);
      },
    };
  }, [index, items, setItems]);

  return (
    <QueriesContext.Provider value={value}>{props.children}</QueriesContext.Provider>
  );

  function emptyRequestParams(): RequestParams {
    const cubes = Object.values(props.cubes);
    return {
      key: Math.random().toString(16).slice(2, 10),
      cube: cubes.length ? cubes[Math.floor(Math.random() * cubes.length)].name : "",
      drilldowns: [],
      measures: [],
    };
  }
}

export function useQueries() {
  const value = useContext(QueriesContext);
  if (value == null) {
    throw new Error("Hook useQueries must be used inside a QueriesProvider node.");
  }
  return value;
}
