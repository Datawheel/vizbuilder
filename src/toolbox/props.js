import debounce from "lodash/debounce";

/**
 * @param {VizBldr.VizbuilderProps["getTopojson"]} getTopojson
 * @returns {(level: import("@datawheel/olap-client").Level) => string}
 */
export function normalizeTopojsonSource(getTopojson) {
  if (typeof getTopojson === "function") {
    return getTopojson;
  }
  const config = getTopojson != null ? getTopojson : {};
  return level => config[level.uniqueName] || config[level.fullName] || config[level.name];
}

export const scrollEnsureHandler =
  debounce(() => window.dispatchEvent(new CustomEvent("scroll")), 400);

export const resizeEnsureHandler =
  debounce(() => window.dispatchEvent(new CustomEvent("resize")), 400);
