import {describe, expect, it, vi} from "vitest";
import type {Column} from "../toolbox/columns";
import type {Dataset} from "../types";
import {DEFAULT_CHART_LIMITS, generateCharts} from "./generator";

// Mock the console.error to avoid noise in test output
vi.spyOn(console, "error").mockImplementation(() => {});

const mockColumn: Column = {
  type: "measure",
  name: "Population",
  isID: false,
  hasID: false,
  dimension: {
    name: "Population",
    type: "measure",
    hierarchy: "Population",
    level: "Population",
  } as any, // Simplified mock
};

const mockLevelColumn: Column = {
  type: "level",
  name: "Year",
  isID: false,
  hasID: false,
  dimension: {
    name: "Year",
    type: "time",
    hierarchy: "Year",
    level: "Year",
  } as any,
};

describe("generateCharts", () => {
  it("should return an empty array if empty datasets are provided", () => {
    const charts = generateCharts([]);
    expect(charts).toEqual([]);
  });

  it("should return an empty array if datasets have no data", () => {
    const dataset: Dataset = {
      columns: {},
      data: [],
      locale: "en",
    };
    const charts = generateCharts([dataset]);
    expect(charts).toEqual([]);
  });

  // Note: Constructing a full valid Dataset that passes all internal validation
  // (buildDatagroup) is complex without importing all the logiclayer-client types.
  // For this initial test setup, we verify the harness works and basic empty cases.
  // A robust test suite would mock buildDatagroup or provide a full fixture.
});
