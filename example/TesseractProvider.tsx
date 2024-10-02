import {useLocalStorage} from "@mantine/hooks";
import {fromPairs} from "lodash";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type {TesseractCube, TesseractDataResponse, TesseractSchema} from "../src/schema";
import type {QueryParams, QueryResult} from "../src/structs";

export function emptyQueryParams(): QueryParams {
  return {
    key: Math.random().toString(16).slice(2, 10),
    cube: "",
    locale: "en",
    drilldowns: [],
    measures: [],
    cuts: [],
    filters: [],
  };
}

interface TesseractContextValue {
  readonly error: string;
  readonly cubes: Record<string, TesseractCube>;
  readonly dataLocale: string;
  readonly availableDataLocale: string[];
  fetchData(params: QueryParams): Promise<TesseractDataResponse>;
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
    key: "tesseract_schema",
    getInitialValueInEffect: false,
    defaultValue: {
      availableLocale: [] as string[],
      locale: "",
      cubes: {} as Record<string, TesseractCube>,
    },
  });
  console.log(schema);

  const fetchSchema = useCallback((): Promise<TesseractSchema> => {
    const url = new URL(`cubes?locale=${schema.locale}`, serverURL);
    return fetch(url, serverConfig).then(response => response.json());
  }, [serverConfig, serverURL, schema.locale]);

  const fetchData = useCallback(
    (params: QueryParams): Promise<TesseractDataResponse> => {
      const url = new URL("data.jsonrecords", serverURL);
      url.search = new URLSearchParams({
        cube: params.cube,
        locale: schema.locale,
        drilldowns: params.drilldowns.join(","),
        measures: params.measures.join(","),
      }).toString();
      return fetch(url, serverConfig).then(response => response.json());
    },
    [serverConfig, serverURL, schema.locale],
  );

  const value = useMemo(() => {
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
      schema => {
        setSchema({
          cubes: fromPairs(schema.cubes.map(cube => [cube.name, cube])),
          availableLocale: schema.locales,
          locale: schema.default_locale,
        });
      },
      err => {
        setError(err.message);
      },
    );
  }, [fetchSchema, setSchema]);

  return (
    <TesseractContext.Provider value={value}>{props.children}</TesseractContext.Provider>
  );
}

export function useTesseract() {
  const value = useContext(TesseractContext);
  if (value == null) {
    throw new Error("Hook useTesseract must be used inside a TesseractProvider node.");
  }
  return value;
}

export function useTesseractData(query: QueryParams | undefined) {
  const {fetchData, cubes} = useTesseract();

  const [state, setState] = useState({
    error: "",
    isLoading: false,
    result: undefined as QueryResult | undefined,
  });

  useEffect(() => {
    const cube = query ? cubes[query.cube] : undefined;
    if (!query || !cube) return;

    setState({error: "", isLoading: true, result: undefined});

    fetchData(query).then(
      result => {
        setState({
          error: "",
          isLoading: false,
          result: {cube, dataset: result.data, params: query},
        });
      },
      err => {
        setState({error: err.message, isLoading: false, result: undefined});
      },
    );
  }, [cubes, fetchData, query]);

  return state;
}
