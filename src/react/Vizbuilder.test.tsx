import {render, screen} from "@testing-library/react";
import React from "react";
import {beforeAll, describe, expect, it, vi} from "vitest";
import type {Dataset} from "../types";
import {Vizbuilder} from "./Vizbuilder";
import {VizbuilderProvider} from "./VizbuilderProvider";

// Mock ResizeObserver
beforeAll(() => {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };

  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

describe("Vizbuilder", () => {
  const emptyDataset: Dataset = {
    columns: {},
    data: [],
    locale: "en",
  };

  it("renders without crashing", () => {
    render(
      <VizbuilderProvider>
        <Vizbuilder datasets={[]} />
      </VizbuilderProvider>,
    );
  });

  it('displays NonIdealState "No results" when dataset is empty', () => {
    render(
      <VizbuilderProvider>
        <Vizbuilder datasets={[emptyDataset]} />
      </VizbuilderProvider>,
    );
    expect(screen.getByText(/No results/i)).toBeInTheDocument();
  });
});
