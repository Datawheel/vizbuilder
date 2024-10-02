import {useLocalStorage} from "@mantine/hooks";
import {clamp} from "lodash";
import React, {createContext, useContext, useMemo, useState} from "react";
import type {QueryParams} from "../src/structs";
import {emptyQueryParams} from "./TesseractProvider";

interface QueriesContextValue {
  readonly queries: QueryParams[];
  readonly currentQuery?: QueryParams;
  setCurrentQuery(key: string): void;
  clearQueries(): void;
  createQuery(): void;
  updateQuery(params: Partial<QueryParams> & {key: string}): void;
  deleteQuery(key: string): void;
}

const QueriesContext = createContext<QueriesContextValue | undefined>(undefined);

export function QueriesProvider(props: {
  children: React.ReactNode;
}) {
  const [index, setIndex] = useState(0);
  const [items, setItems] = useLocalStorage({
    key: "queries",
    getInitialValueInEffect: false,
    defaultValue: [emptyQueryParams()],
  });

  const value = useMemo(() => {
    return {
      queries: items,
      currentQuery: items[clamp(index, 0, items.length - 1)],
      setCurrentQuery(key: string) {
        const index = items.findIndex(item => item.key === key);
        if (index > -1) setIndex(index);
      },
      clearQueries() {
        setItems([emptyQueryParams()]);
        setIndex(0);
      },
      createQuery() {
        const obj = emptyQueryParams();
        setItems([...items, obj]);
        setIndex(items.length);
      },
      updateQuery(params: Partial<QueryParams> & {key: string}) {
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
}

export function useQueries() {
  const value = useContext(QueriesContext);
  if (value == null) {
    throw new Error("Hook useQueries must be used inside a QueriesProvider node.");
  }
  return value;
}
