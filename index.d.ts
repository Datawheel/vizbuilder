import React from "react";
import * as OlapClient from "@datawheel/olap-client";

// tslint:disable-next-line:export-just-namespace
export = VizBldr;
export as namespace VizBldr;

declare namespace VizBldr {
  const Vizbuilder: React.FC<VizbuilderProps>;

  function buildQueryParams(
    query: OlapClient.Query,
    formatters?: ((measure: OlapClient.Measure | string) => Formatter) | Record<string, Formatter>
  ): QueryParams;

  interface VizbuilderProps {
    allowedChartTypes?: ChartType[];
    className?: string;
    datacap?: number;
    defaultLocale?: string;
    downloadFormats?: string[];
    measureConfig?: Record<string, D3plusConfig> | ((measure: OlapClient.Measure) => D3plusConfig);
    onPeriodChange?: (period: Date) => void;
    queries: QueryResult | QueryResult[];
    showConfidenceInt?: boolean;
    toolbar?: React.ReactNode;
    topojsonConfig?: Record<string, D3plusConfig> | ((level: OlapClient.Level) => D3plusConfig);
    translations?: Record<string, Translation>;
    userConfig?: D3plusConfig;
  }

  type Formatter = (value: number) => string;

  type D3plusConfig = {[key: string]: any};

  type ChartType =
    | "barchart"
    | "barchartyear"
    | "donut"
    | "geomap"
    | "histogram"
    | "lineplot"
    | "pie"
    | "stacked"
    | "treemap";

  interface QueryResult {
    cube: OlapClient.AdaptedCube;
    dataset: any[];
    params: QueryParams;
  }

  interface QueryParams {
    booleans: Record<string, boolean>;
    cuts: Struct.CutItem[];
    drilldowns: Struct.DrilldownItem[];
    filters: Struct.FilterItem[];
    growth: Struct.GrowthItem[];
    measures: Struct.MeasureItem[];
  }

  interface Translation {
    "action_close": string;
    "action_download": string;
    "action_enlarge": string;
    "action_retry": string;
    "action_fileissue": string;
    "chart_labels": {
      "ci": string;
      "collection": string;
      "moe": string;
      "source": string;
    };
    "error": {
      "detail": string;
      "message": string;
      "title": string;
    };
    "sentence_connectors": {
      "all_words": string;
      "two_words": string;
      "last_word": string;
    };
  }

  namespace Struct {
    interface CutItem {
      dimension?: string;
      hierarchy?: string;
      level: string;
      members: string[];
      exclude?: boolean;
    }

    interface DrilldownItem {
      dimension?: string;
      hierarchy?: string;
      level: string;
      properties?: string[];
      caption?: string;
    }

    interface FilterItem {
      constraint1: [OlapClient.Comparison, number];
      constraint1?: [OlapClient.Comparison, number] | undefined;
      formatter?: Formatter;
      joint?: "and" | "or" | undefined;
      measure: string;
    }

    interface GrowthItem {
      measure: string;
      dimension?: string;
      hierarchy?: string;
      level: string;
    }

    interface MeasureItem {
      collection?: string;
      formatter?: Formatter;
      lci?: string;
      measure: string;
      moe?: string;
      source?: string;
      uci?: string;
    }

    interface Datagroup {
      cube: OlapClient.Cube;
      cuts: Map<string, string[]>;
      datacap: number;
      dataset: any[];
      drilldowns: OlapClient.Level[];
      filters: FilterSet[];
      geoDrilldown: OlapClient.Level | undefined;
      maxPeriod: number | undefined;
      measureSets: MeasureSet[];
      members: Record<string, number[]> | Record<string, string[]>;
      membersCount: Record<string, number>;
      params: QueryParams;
      stdDrilldowns: OlapClient.Level[];
      timeDrilldown: OlapClient.Level | undefined;
      topojsonConfig: D3plusConfig | undefined;
    }

    interface Chart {
      chartType: ChartType;

      /** The Datagroup object where this Chart comes from. */
      dg: Datagroup;

      /** Indicates if this Chart is intended to be presented as a map. */
      isMap: boolean;

      /** Indicates if this Chart has a dimension that shows variations over a period of time. Charts with a time axis don't count. */
      isTimeline: boolean;

      /** Indicates if this Chart only presents a few selected items from a much longer list, to simplify the interpretation. */
      isTopTen?: boolean;

      /** A string that uniquely identifies this chart in the context of the query it belongs to. */
      key: string;

      /** A list of the Levels shown in this Chart. */
      levels: OlapClient.Level[];

      /** The measure (and its associated error measures) shown in this chart. */
      measureSet: MeasureSet;
    }

    interface FilterSet {
      /** The measure set directly by the user. */
      measure: OlapClient.Measure;

      /** A formatting function to display values. */
      formatter: Formatter;

      /** Main constraint for the filter */
      constraint1: [OlapClient.Comparison, number];

      /** Additional constraint for the filter, associated to the same measure. */
      constraint2?: [OlapClient.Comparison, number];

      /** The joint condition for the constraints, only valid when both are defined. */
      joint?: "and" | "or";
    }

    interface MeasureSet {
      /** The measure set directly by the user. */
      measure: OlapClient.Measure;

      /** A formatting function to display values. */
      formatter: Formatter;

      /** */
      collection: OlapClient.Measure | undefined;

      /** */
      source: OlapClient.Measure | undefined;

      /** Margin of Error measure for the current measure. */
      moe?: OlapClient.Measure;

      /** The Lower Confidence Interval measure for the current measure. */
      lci?: OlapClient.Measure;

      /** The Upper Confidence Interval measure for the current measure. */
      uci?: OlapClient.Measure;
    }
  }
}
