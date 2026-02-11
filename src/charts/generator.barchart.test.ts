import {describe, expect, it, vi} from "vitest";
import {generateCharts} from "./generator";
import {createMockDataset} from "./generator.mock";

vi.spyOn(console, "error").mockImplementation(() => {});

describe("generateCharts - BarChart", () => {
  it("should generate a simple BarChart for 1 Category Dimension (Standard) + 1 Measure", () => {
    const dataset = createMockDataset({
      dimensions: [{name: "Category", type: "standard" as any}],
      measures: ["Value"],
      data: [
        {Category: "A", Value: 10},
        {Category: "B", Value: 20},
      ],
    });

    const charts = generateCharts([dataset]);
    const barCharts = charts.filter(c => c.type === "barchart");

    expect(barCharts.length).toBeGreaterThan(0);
    expect(barCharts[0].type).toBe("barchart");
    // Verify it picks the correct axes
    const chart = barCharts[0];
    if (chart.type === "barchart") {
      expect(chart.values.measure.name).toBe("Value");
      expect(chart.series[0].level.name).toBe("Category");
    }
  });

  it("should NOT generate BarChart if dimension cardinality exceeds BARCHART_MAX_BARS", () => {
    // limit is usually 24
    const data = Array.from({length: 30}, (_, i) => ({Category: `C${i}`, Value: i}));
    const dataset = createMockDataset({
      dimensions: [{name: "Category", type: "standard" as any}],
      measures: ["Value"],
      data,
    });

    const charts = generateCharts([dataset], {chartLimits: {BARCHART_MAX_BARS: 20}});
    const barChartCount = charts.filter(c => c.type === "barchart").length;

    // We expect it to be empty if the rule is strict.
    expect(barChartCount).toBe(0);
  });
});
