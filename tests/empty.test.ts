import {
  type TesseractDataResponse,
  TesseractModuleClient,
} from "@datawheel/logiclayer-client";
import {describe, expect, test} from "vitest";
import {generateCharts} from "../src/charts/generator";
import {buildColumn} from "../src/toolbox/columns";

describe("generateCharts", async () => {
  const locale = "en";
  const url = new URL("https://api.datasaudi.datawheel.us/tesseract/");
  const client = new TesseractModuleClient(url);

  const schema = await client.fetchSchema({locale});
  const cubes = schema.cubes.filter(cube => !cube.annotations.hide_in_ui);

  test.for(cubes)("should return at least a Chart for cube $name", async cube => {
    const hiddenDimensions = (cube.annotations.hidden_dimensions || "").split(",");
    const hiddenMeasures = (cube.annotations.hidden_measures || "").split(",");

    const measures = cube.measures
      .filter(item => !item.annotations.hide_in_ui && !hiddenMeasures.includes(item.name))
      .map(getName);
    const dimensions = cube.dimensions.filter(
      dimension => !hiddenDimensions.includes(dimension.name),
    );
    const levels = Object.fromEntries(
      dimensions.flatMap(dim =>
        dim.hierarchies.flatMap(hie => hie.levels.map(lvl => [lvl.name, lvl] as const)),
      ),
    );
    const drilldownSets = dimensions.reduce(
      (combos, dimension) => {
        const {hierarchies} = dimension;
        return combos.flatMap(dds =>
          hierarchies.map(hie => [...dds, ...hie.levels.map(getName)]),
        );
      },
      [[]] as string[][],
    );

    expect(drilldownSets.length).toBeGreaterThan(0);

    for (const drilldowns of drilldownSets) {
      const exclude = drilldowns
        .flatMap(dd => {
          const level = levels[dd];
          const members = level.annotations.vb_exclude_members || "";
          return level && members ? `${level.name}:${members.split(",")}` : [];
        })
        .join(";");

      const {columns, data}: TesseractDataResponse = await client
        .fetchData({cube: cube.name, measures, drilldowns, exclude}, "jsonrecords")
        .then(res => res.json());
      const charts = generateCharts([
        {
          columns: Object.fromEntries(
            columns.map(column => [column, buildColumn(cube, column, columns)]),
          ),
          data: data,
          locale,
        },
      ]);
      expect(charts.length).toBeGreaterThan(0);
    }
  });
});

function getName(item: {name: string}) {
  return item.name;
}
