import {describe, expect, it, vi} from "vitest";
import type {Dataset} from "../types";
import {generateCharts} from "./generator";

// Mock the console.error to avoid noise in test output
vi.spyOn(console, "error").mockImplementation(() => {});

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
