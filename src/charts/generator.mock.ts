import type {
  TesseractDimension,
  TesseractHierarchy,
  TesseractLevel,
  TesseractMeasure,
} from "@datawheel/logiclayer-client";
import type {Column} from "../toolbox/columns";
import type {Dataset} from "../types";

export function createMockDataset(
  options: {
    measures?: (string | Partial<TesseractMeasure>)[];
    dimensions?: (string | Partial<TesseractDimension>)[];
    data?: Record<string, unknown>[];
    locale?: string;
  } = {},
): Dataset {
  const {
    measures = ["Population"],
    dimensions = ["Year"],
    data = [],
    locale = "en",
  } = options;

  const columns: Record<string, Column> = {};

  measures.forEach(measureDef => {
    const name = typeof measureDef === "string" ? measureDef : measureDef.name!;
    const measure: TesseractMeasure = {
      name,
      caption: name,
      annotations: {},
      aggregator: "SUM" as any, // Simplified string
      type: "measure",
      ...(typeof measureDef === "object" ? measureDef : {}),
    } as any;

    columns[name] = {
      name,
      type: "measure",
      measure,
      parentMeasure: undefined,
      parentRelationship: undefined,
    };
  });

  dimensions.forEach(dimDef => {
    const name = typeof dimDef === "string" ? dimDef : dimDef.name!;
    const dimName = name;
    const hierarchyName = name;
    const levelName = name;

    const dimension: TesseractDimension = {
      name: dimName,
      caption: dimName,
      type: name === "Year" ? "time" : "geo", // Default heuristic
      hierarchies: [],
      annotations: {},
      ...(typeof dimDef === "object" ? dimDef : {}),
    } as any;

    const hierarchy: TesseractHierarchy = {
      name: hierarchyName,
      caption: hierarchyName,
      dimension,
      levels: [],
      annotations: {},
    } as any;

    const level: TesseractLevel = {
      name: levelName,
      caption: levelName,
      hierarchy,
      depth: 1,
      annotations: {},
      properties: [],
    } as any;

    columns[name] = {
      name,
      type: "level",
      dimension,
      hierarchy,
      level,
      isID: true,
      hasID: false,
    };
  });

  return {
    columns,
    data,
    locale,
  };
}
