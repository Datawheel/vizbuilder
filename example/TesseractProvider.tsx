import {useLocalStorage} from "@mantine/hooks";
import {fromPairs} from "lodash-es";
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
import {buildColumn} from "../src/toolbox/columns";
import type {Dataset} from "../src/types";
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
        drilldowns: params.drilldowns.sort().join(","),
        measures: params.measures.sort().join(","),
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
  }, [error, fetchSchema, fetchData, schema]);

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
  }, [fetchSchema, schema.locale]);

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
    const error = errorInQuery(query);
    if (!query || !cube || error) {
      const dataset = {columns: {}, data: [], locale: dataLocale};
      setState({error, isLoading: false, dataset});
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
          dataset: {
            columns,
            data: result.data.filter(row =>
              Object.values(row).every(value => value !== null),
            ),
            locale: dataLocale,
          },
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

function errorInQuery(query: RequestParams | undefined) {
  if (!query) {
    return "Request object has not been initialized.";
  }
  if (!query.cube) {
    return "Request object doesn't have a cube defined.";
  }
  if (query.drilldowns.length === 0) {
    return "Request has no drilldowns selected";
  }
  if (query.measures.length === 0) {
    return "Request has no measures selected";
  }
  return "";
}
