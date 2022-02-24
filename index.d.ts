import React from "react";
import * as OlapClient from "@datawheel/olap-client";
import * as I18N from "@datawheel/use-translation";

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
    chartLimits?: Optional<ChartLimits>;
    className?: string;
    datacap?: number;
    defaultLocale?: string;
    downloadFormats?: string[];
    measureConfig?: Record<string, D3plusConfig> | ((measure: OlapClient.Measure) => D3plusConfig);
    nonIdealState?: React.ComponentType,
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

  interface ChartLimits {
    /** Maximum number of bars in barchart */
    BARCHART_MAX_BARS: number;
    /** Maximum number of bars in a year barchart */
    BARCHART_YEAR_MAX_BARS: number;
    /** Max number of groups to be rendered in a donut or pie chart */
    DONUT_SHAPE_MAX: number;
    /** Minimum number of data points in groupto render a line in lineplot */
    LINEPLOT_LINE_POINT_MIN: number;
    /** Max number of lines to render in lineplot */
    LINEPLOT_LINE_MAX: number;
    /** Max shapes to render in stacked chart */
    STACKED_SHAPE_MAX: number;
    /** Min number of data members in the time dimension (e.g. number of years) required to render stacked area chart */
    STACKED_TIME_MEMBER_MIN: number;
    /** Max number of shapes to render in tree map */
    TREE_MAP_SHAPE_MAX: number;
  }

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

  interface Translation extends I18N.TranslationDict {
    "action_close": string;
    "action_download": string;
    "action_enlarge": string;
    "action_retry": string;
    "action_fileissue": string;
    "aggregators": {
      "avg": string,
      "max": string,
      "min": string
    };
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
    "nonidealstate_msg"?: string;
    "sentence_connectors": {
      "and": string;
    };
    "title": {
      "of_selected_cut_members": string;
      "top_drilldowns": string;
      "by_drilldowns": string;
      "over_time": string;
      "measure_and_modifier": string;
    }
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

  interface UIParams {
    currentChart: string;
    isSingleChart: boolean;
    isUniqueChart: boolean;
    locale: string;
    measureConfig: (measure: OlapClient.Measure) => D3plusConfig;
    showConfidenceInt: boolean;
    translate: I18N.TranslateFunction;
    userConfig: D3plusConfig;
  }
}
