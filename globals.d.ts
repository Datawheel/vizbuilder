import type { D3plusConfig } from "./src";

declare var global: any;

declare module "d3plus-common" {
  export const RESET: string;

  export function assign<T extends {}, U>(
    target: T,
    ...obj: Partial<U>[]
  ): target is T & U;
}

declare module "d3plus-react" {
  type VizProps = {
    className: string;
    config: D3plusConfig;
    dataFormat: () => any;
    linksFormat: () => any;
    nodesFormat: () => any;
    topojsonFormat: () => any;
    }

  export const AreaPlot: React.ComponentType<VizProps>;
  export const BarChart: React.ComponentType<VizProps>;
  export const BoxWhisker: React.ComponentType<VizProps>;
  export const BumpChart: React.ComponentType<VizProps>;
  export const Donut: React.ComponentType<VizProps>;
  export const Geomap: React.ComponentType<VizProps>;
  export const LinePlot: React.ComponentType<VizProps>;
  export const Matrix: React.ComponentType<VizProps>;
  export const Network: React.ComponentType<VizProps>;
  export const Pack: React.ComponentType<VizProps>;
  export const Pie: React.ComponentType<VizProps>;
  export const Plot: React.ComponentType<VizProps>;
  export const Priestley: React.ComponentType<VizProps>;
  export const Radar: React.ComponentType<VizProps>;
  export const RadialMatrix: React.ComponentType<VizProps>;
  export const Rings: React.ComponentType<VizProps>;
  export const Sankey: React.ComponentType<VizProps>;
  export const StackedArea: React.ComponentType<VizProps>;
  export const Tree: React.ComponentType<VizProps>;
  export const Treemap: React.ComponentType<VizProps>;

  export const D3plusContext: React.Context;
}
