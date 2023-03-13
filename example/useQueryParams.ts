import { useCallback } from "react";
import { useStoredState } from "./useStorage";

export interface QueryParams {
  cube: string;
  drilldowns: string[];
  measures: string[];
}

export function useQueryParams(key: string) {
  const [query, setQuery] = useStoredState<QueryParams>(`query_${key}`, {
    cube: "",
    drilldowns: [],
    measures: [],
  });

  const setQueryProp = useCallback(<K extends keyof QueryParams>(key: K, value: QueryParams[K]) => {
    setQuery({...query, [key]: value});
  }, [query]);

  return [query, setQueryProp] as const;
}
