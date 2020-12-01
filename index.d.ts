import React from "react";
import * as OlapClnt from "@datawheel/olap-client";

// tslint:disable-next-line:export-just-namespace
export = VizBldr;
export as namespace VizBldr;

declare namespace VizBldr {
  const Vizbuilder: React.FC<VizbuilderProps>;

  interface VizbuilderProps {
    allowedChartTypes?: ChartType[];
    className?: string;
    datacap?: number;
    defaultLocale?: string;
    measureConfig?: Record<string, D3plusConfig> | ((measure: OlapClnt.Measure) => D3plusConfig);
    onPeriodChange?: (period: Date) => void;
    queries: QueryResult | QueryResult[];
    showConfidenceInt?: boolean;
    topojsonConfig?: Record<string, D3plusConfig> | ((level: OlapClnt.Level) => D3plusConfig);
    translations?: Record<string, Translation>;
    userConfig?: D3plusConfig;
  }

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
    cube: OlapClnt.AdaptedCube;
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
  }

  namespace Struct {
    interface CutItem {
      dimension?: string;
      hierarchy?: string;
      level: string;
      members: string[];
    }

    interface DrilldownItem {
      dimension?: string;
      hierarchy?: string;
      level: string;
      properties?: string[];
      caption?: string;
    }

    interface FilterItem {
      comparison: string;
      formatter?: (value: number) => string;
      measure: string;
      value: string;
    }

    interface GrowthItem {
      measure: string;
      dimension?: string;
      hierarchy?: string;
      level: string;
    }

    interface MeasureItem {
      collection?: string;
      formatter?: (value: number) => string;
      lci?: string;
      measure: string;
      moe?: string;
      source?: string;
      uci?: string;
    }

    interface Datagroup {
      cube: OlapClnt.Cube;
      cuts: Map<string, string[]>;
      datacap: number;
      dataset: any[];
      drilldowns: OlapClnt.Level[];
      filters: FilterSet[];
      geoDrilldown: OlapClnt.Level | undefined;
      maxPeriod: number | undefined;
      measureSets: MeasureSet[];
      members: Record<string, number[]> | Record<string, string[]>;
      membersCount: Record<string, number>;
      params: QueryParams;
      stdDrilldowns: OlapClnt.Level[];
      timeDrilldown: OlapClnt.Level | undefined;
      topojsonConfig: D3plusConfig | undefined;
    }

    interface Chart {
      chartType: ChartType;
      dg: Datagroup;
      isTopTen?: boolean;
      key: string;
      measureSet: MeasureSet;
      levels: OlapClnt.Level[];
    }

    interface FilterSet {
      comparison: string;

      formatter: (value: number) => string;

      measure: OlapClnt.Measure;

      value: string;
    }

    interface MeasureSet {
      /** The measure set directly by the user. */
      measure: OlapClnt.Measure;

      /** A formatting function to display values. */
      formatter: (value: number) => string;

      /** Collection measure. */
      collection: OlapClnt.Measure | undefined;

      /** */
      source: OlapClnt.Measure | undefined;

      /** Margin of error measure for the current measure. */
      moe?: OlapClnt.Measure;

      /** The Lower Confidence Interval measure for the current measure. */
      lci?: OlapClnt.Measure;

      /** The Upper Confidence Interval measure for the current measure. */
      uci?: OlapClnt.Measure;
    }
  }
}
