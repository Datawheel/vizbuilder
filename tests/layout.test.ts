import {describe, expect, it} from "vitest";
import {type CalcOptions, calculateLayout} from "../src/toolbox/layout";

describe("calculateLayout", () => {
  it("should return a basic grid fallback when totalItems is 0", () => {
    const options: CalcOptions = {
      containerWidth: 800,
      containerHeight: 600,
      targetCellWidth: 400,
      totalItems: 0,
    };

    const result = calculateLayout(options);
    expect(result).toHaveLength(1);
    expect(result[0].columns).toBe(2);
    expect(result[0].rows).toBe(2); // 400 / (4/3) = 300 cell height -> 600 / 300 = 2 rows
    expect(result[0].itemsPerPage).toBe(4);
  });

  it("should calculate accurate standard pagination with exact fits", () => {
    const options: CalcOptions = {
      containerWidth: 800,
      containerHeight: 600,
      targetCellWidth: 400,
      totalItems: 10, // 4 items per page = 3 pages
    };

    const result = calculateLayout(options);

    expect(result).toHaveLength(3);

    // Page 1
    expect(result[0].pageIndex).toBe(0);
    expect(result[0].itemsPerPage).toBe(4);

    // Page 2
    expect(result[1].pageIndex).toBe(1);
    expect(result[1].itemsPerPage).toBe(4);
  });

  it("should account for gaps correctly without breaking layout", () => {
    const options: CalcOptions = {
      containerWidth: 820, // 400 + 400 + 20 gap
      containerHeight: 620, // 300 + 300 + 20 gap
      targetCellWidth: 400,
      gap: 20,
      totalItems: 4,
    };

    const result = calculateLayout(options);
    expect(result[0].columns).toBe(2);
    expect(result[0].rows).toBe(2);
    expect(result[0].cellWidth).toBe(400);
    expect(result[0].cellHeight).toBe(300);
  });

  it("should resist floating-point subpixel drops (the +0.001 epsilon fix)", () => {
    // 599.9 container height mathematically results in ~1.999 rows.
    // The epsilon should bump this safely back to 2 rows to prevent UI jitter.
    const options: CalcOptions = {
      containerWidth: 800,
      containerHeight: 599.9,
      targetCellWidth: 400,
      totalItems: 4,
    };

    const result = calculateLayout(options);
    expect(result[0].rows).toBe(2);
  });

  it("should dynamically reshape the last page to minimize empty slots (the 21-item 3x3 fix)", () => {
    const options: CalcOptions = {
      containerWidth: 1600,
      containerHeight: 900,
      targetCellWidth: 400, // exact 4x3 standard grid = 12 items/page
      totalItems: 21, // Page 1: 12 items. Page 2: 9 items.
    };

    const result = calculateLayout(options);

    expect(result).toHaveLength(2);

    // Page 1 should be standard 4 cols x 3 rows
    expect(result[0].columns).toBe(4);
    expect(result[0].rows).toBe(3);

    // Page 2 has 9 items. It should reshape to 3 cols x 3 rows to avoid 3 empty slots.
    expect(result[1].columns).toBe(3);
    expect(result[1].rows).toBe(3);
    expect(result[1].itemsPerPage).toBe(9);
  });

  it("should respect minCellWidth to prevent tiny charts on portrait mobile", () => {
    const options: CalcOptions = {
      containerWidth: 549,
      containerHeight: 852,
      targetCellWidth: 380, // ±15% = 323 to 437. 2 cols would be ~274px.
      minCellWidth: 330, // Hard limit blocks the 2-column fallback
      totalItems: 6,
    };

    const result = calculateLayout(options);

    // It should force 1 column instead of 2 because 274 < 330.
    expect(result[0].columns).toBe(1);
    expect(result[0].cellWidth).toBe(549);
  });

  it("should allow more columns if target cell width flex allows it", () => {
    const options: CalcOptions = {
      containerWidth: 1000,
      containerHeight: 600,
      targetCellWidth: 400,
      widthFlex: 0.25, // ±25% -> minimum allowed is 300px
      totalItems: 5,
    };

    const result = calculateLayout(options);

    // Exact mathematical columns: 1000 / 400 = 2.5
    // 3 columns = 333px width. Since 333px >= 300px (our flex min), it should allow 3 cols.
    expect(result[0].columns).toBe(3);
  });
});
