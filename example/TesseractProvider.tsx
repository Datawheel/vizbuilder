import {useLocalStorage} from "@mantine/hooks";
import {fromPairs} from "lodash";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {TesseractCube, TesseractDataResponse, TesseractSchema} from "../src/schema";
import type {Dataset} from "../src/structs";
import {buildColumn} from "../src/toolbox/columns";
import {QueriesProvider, type RequestParams} from "./QueriesProvider";

interface TesseractContextValue {
  readonly error: string;
  readonly cubes: Record<string, TesseractCube>;
  readonly dataLocale: string;
  readonly availableDataLocale: string[];
  fetchData(params: RequestParams): Promise<TesseractDataResponse>;
  fetchSchema(): Promise<TesseractSchema>;
  setDataLocale(locale: string): void;
}

const TesseractContext = createContext<TesseractContextValue | undefined>(undefined);

export function TesseractProvider(props: {
  children: React.ReactNode;
  serverURL: string | URL;
  serverConfig?: RequestInit;
}) {
  const {serverURL, serverConfig} = props;

  const [error, setError] = useState("");

  const [schema, setSchema] = useLocalStorage({
    key: "TesseractProvider:schema",
    getInitialValueInEffect: false,
    defaultValue: {
      availableLocale: [] as string[],
      locale: "", // keep falsey
      cubes: {} as Record<string, TesseractCube>,
    },
  });

  const schemaController = useRef<AbortController | undefined>();

  const fetchSchema = useCallback((): Promise<TesseractSchema> => {
    if (schemaController.current) schemaController.current.abort();

    const controller = new AbortController();
    schemaController.current = controller;

    const url = new URL(`cubes?locale=${schema.locale}`, serverURL);

    return fetch(url, {...serverConfig, signal: controller.signal}).then(response =>
      response.json(),
    );
  }, [serverConfig, serverURL, schema.locale]);

  const dataController = useRef<AbortController | undefined>();

  const fetchData = useCallback(
    (params: RequestParams): Promise<TesseractDataResponse> => {
      if (dataController.current) dataController.current.abort();

      const controller = new AbortController();
      dataController.current = controller;

      const url = new URL("data.jsonrecords", serverURL);
      url.search = new URLSearchParams({
        cube: params.cube,
        locale: schema.locale,
        drilldowns: params.drilldowns.join(","),
        measures: params.measures.join(","),
      }).toString();

      return fetch(url, {...serverConfig, signal: controller.signal}).then(response =>
        response.json(),
      );
    },
    [serverConfig, serverURL, schema.locale],
  );

  const value = useMemo((): TesseractContextValue => {
    return {
      error,
      cubes: schema.cubes,
      dataLocale: schema.locale,
      availableDataLocale: schema.availableLocale,
      fetchData,
      fetchSchema,
      setDataLocale(locale: string) {
        if (schema.availableLocale.includes(locale)) {
          setSchema({...schema, locale});
        }
      },
    };
  }, [error, fetchSchema, fetchData, schema, setSchema]);

  useEffect(() => {
    fetchSchema().then(
      data => {
        setSchema({
          cubes: fromPairs(data.cubes.map(cube => [cube.name, cube])),
          availableLocale: data.locales,
          locale: schema.locale || data.default_locale,
        });
      },
      err => {
        setError(err.message);
      },
    );
  }, [fetchSchema, setSchema, schema.locale]);

  return (
    <TesseractContext.Provider value={value}>
      <QueriesProvider cubes={value.cubes}>{props.children}</QueriesProvider>
    </TesseractContext.Provider>
  );
}

export function useTesseract() {
  const value = useContext(TesseractContext);
  if (value == null) {
    throw new Error("Hook useTesseract must be used inside a TesseractProvider node.");
  }
  return value;
}

export function useTesseractData(query: RequestParams | undefined) {
  const {cubes, fetchData, dataLocale} = useTesseract();

  const [state, setState] = useState({
    error: "",
    isLoading: false,
    dataset: undefined as Dataset | undefined,
  });

  useEffect(() => {
    const cube = query ? cubes[query.cube] : undefined;
    if (!query || !cube || !query.drilldowns.length || !query.measures.length) {
      setState({
        error: "Invalid query",
        isLoading: false,
        dataset: {columns: {}, data: [], locale: dataLocale},
      });
      return;
    }

    setState({error: "", isLoading: true, dataset: undefined});

    fetchData(query).then(
      result => {
        const columns = Object.fromEntries(
          result.columns.map((name, _, cols) => [name, buildColumn(cube, name, cols)]),
        );
        setState({
          error: "",
          isLoading: false,
          dataset: {columns, data: result.data, locale: dataLocale},
        });
      },
      err => {
        if (err.message !== "The operation was aborted.")
          setState({error: err.message, isLoading: false, dataset: undefined});
      },
    );
  }, [cubes, fetchData, query, dataLocale]);

  return state;
}
