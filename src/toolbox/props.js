import debounce from "lodash/debounce";

/**
 * 
 * @param {VizBldr.VizbuilderProps["measureConfig"]} measureConfig 
 * @returns {(measure: import("@datawheel/olap-client").Measure) => VizBldr.D3plusConfig}
 */
export function normalizeMeasureConfig(measureConfig) {
  if (typeof measureConfig === "function") {
    return measureConfig;
  }
  const config = measureConfig != null ? measureConfig : {};
  return measure => config[measure.name];
}

/**
 * @param {VizBldr.VizbuilderProps["topojsonConfig"]} topojsonConfig
 * @returns {(level: import("@datawheel/olap-client").Level) => VizBldr.D3plusConfig}
 */
export function normalizeTopojsonConfig(topojsonConfig) {
  if (typeof topojsonConfig === "function") {
    return topojsonConfig;
  }
  const config = topojsonConfig != null ? topojsonConfig : {};
  return level => config[level.uniqueName] || config[level.fullName] || config[level.name];
}

export const scrollEnsureHandler =
  debounce(() => window.dispatchEvent(new CustomEvent("scroll")), 400);

export const resizeEnsureHandler =
  debounce(() => window.dispatchEvent(new CustomEvent("resize")), 400);
