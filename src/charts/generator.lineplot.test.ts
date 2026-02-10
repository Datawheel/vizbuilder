import {describe, expect, it, vi} from "vitest";
import {generateCharts} from "./generator";
import {createMockDataset} from "./generator.mock";

vi.spyOn(console, "error").mockImplementation(() => {});

describe("generateCharts - LinePlot", () => {
  it("should generate a LinePlot for Time Dimension + 1 Measure", () => {
    const dataset = createMockDataset({
      dimensions: ["Year"], // Mock defaults 'Year' to type: 'time'
      measures: ["Population"],
      data: [
        {Year: "2000", Population: 100},
        {Year: "2001", Population: 110},
      ],
    });

    const charts = generateCharts([dataset]);
    const linePlots = charts.filter(c => c.type === "lineplot");

    expect(linePlots.length).toBeGreaterThan(0);
    expect(linePlots[0].type).toBe("lineplot");

    // Verify structure
    const chart = linePlots[0];
    if (chart.type === "lineplot") {
      expect(chart.values.measure.name).toBe("Population");
      expect(chart.timeline.level.name).toBe("Year");
    }
  });

  it("should NOT generate LinePlot if time series data points are insufficient", () => {
    // DEFAULT_CHART_LIMITS.LINEPLOT_LINE_POINT_MIN is 2
    const dataset = createMockDataset({
      dimensions: ["Year"],
      measures: ["Population"],
      data: [
        {Year: 2000, Population: 100}, // Only 1 point
      ],
    });

    const charts = generateCharts([dataset]);
    const linePlots = charts.filter(c => c.type === "lineplot");
    expect(linePlots.length).toBe(0);
  });
});
