import "@datawheel/logiclayer-client";

declare module "@datawheel/logiclayer-client" {
  interface Annotations {
    /** Instructs front-ends to skip listing the specified element in a user-interface */
    hide_in_ui?: "true";
    /** Do not display this element on a map */
    hide_in_map?: "true";
  }

  interface CubeAnnotations {
    /** Dimensions separated by comma */
    available_dimensions?: string;
    /** Measures separated by comma */
    available_measures?: string;
    /**
     * Names of dimensions separated by commas.
     * These dimensions should be hidden by default for drilldown purposes in user-interfaces
     */
    crosswalk_only_dimensions?: string;
    /** Name of specific data set */
    dataset_name: string;
    /** Link to underlying data */
    dataset_link: string;
    /** Dimensions separated by commas that should not be shown in user-interfaces */
    hidden_dimensions: string;
    /** Measures separated by comma that should not be shown in user-interfaces */
    hidden_measures: string;
    /** Description of source */
    source_description: string;
    /** Source of data */
    source_name: string;
    /** General link for the source providing the dataset */
    source_link: string;
    /** Subtopic area of dataset (for use in dropdown/variable explorer) */
    subtopic: string;
    /** Levels separated by comma, to be used by default when a cube is first selected and a request is to be made. */
    suggested_levels?: string;
    /** General topic area of dataset (for use in dropdown/variable explorer) */
    topic: string;
    /** List of member IDs separated by comma, to exclude them from the visualizations */
    vb_exclude_members?: string;
  }

  interface MeasureAnnotations {
    /** Method by which the measure is aggregated */
    aggregation_method?: "COUNT" | "SUM" | "AVERAGE" | "MEDIAN" | "MOE" | "RCA";
    /** Expanded description of a particular Measure */
    details?: string;
    /** Specifies the type of calculated error this measure returns */
    error_type?: "moe" | "lci" | "uci";
    /** Specifies a custom formatter template, hydratable with d3plus-format */
    format_template?: string;
    /** The measure which the RCA calculation uses */
    rca_measure?: string;
    /** Comma separated list of the dimensions which the RCA calculation uses */
    rca_dimensions?: string;
    /** Information on the kind of unit the Measure represents */
    units_of_measurement?:
      | "Growth" // Values will be rendered as [n*100]%.
      | "Percentage" // Values will be rendered as [n]%.
      | "Rate" // Values will be rendered as [n*100]%.
      | "Ratio" // Values will be rendered as [n] to 1.
      | "USD"
      | "Dollars" // Values will be rendered as $[n], without cents.
      | "Thousands of Dollars" // Values are converted to Dollars (n*1000), and are rendered with the Dollars formatter.
      | "Millions of Dollars" // Values are converted to Dollars (n*1e6), and are rendered with the Dollars formatter.
      | "Billions of Dollars" // Values are converted to Dollars (n*1e9), and are rendered with the Dollars formatter.
      | "Years"
      | "People"
      | "Households"
      | "Housing Units"
      | "Occupied Households"
      | "Families"
      | "Deaths"
      | "Index";
  }

  interface DimensionAnnotations {
    /** Tells UI elements that this should be treated as the default year dimension */
    default_year?: "true";
    /** The type of the dimension, which lets the vizbuilder do specific things. */
    dim_type?: string;
    /** Boolean to inform whether the user must cut or drilldown on this dimension when using this cube */
    is_required?: "true" | "false";
  }
}
