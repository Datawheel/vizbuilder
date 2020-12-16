# vizbuilder-core

A React component to visualize multiple kinds of charts according to the data returned by a [`olap-client`](https://www.npmjs.com/package/@datawheel/olap-client) query.

![npm package](https://img.shields.io/npm/v/@datawheel/vizbuilder)

## Installation

We suggest the use of the pnpm package manager, but npm and yarn can be used without a problem.

```bash
npm i @datawheel/vizbuilder
```

## Usage

This component only exports a React component that makes the charts based on one or multiple queries. The internal code does all the possible remixes that make sense based on the query results it is passed, and the additional parameters it is given. These parameters mainly restrict the types of charts generated and add parameters to the d3plus config for each chart, and are usually dependent to the datasource it is being used for this visualization.

To use it, import the named component from the package:

```js
import {Vizbuilder} from "@datawheel/vizbuilder";
```

This package doesn't include a stylesheet. It's up to your implementation to setup the UI of the component. The DOM nodes have classnames under the `vb-` namespace. It's suggested to take advantage of CSS grid or CSS flexbox to structure the layout and order of the elements.

## Component properties

### `queries`
* Type: `QueryResult | QueryResult[]`
* **Required**

A single query result, or an array of these, to generate the charts. Each `QueryResult` object should contain the needed info about the cube where the information is coming from, query used to get the data, and the data aggregation itself. Check the [`QueryResult` interface](#interface-queryresult) to know details of the object structure.

### `allowedChartTypes`
* Type: [`ChartType[]`](#type-charttype)
* **Optional**, default value: `["barchart", "barchartyear", "donut", "geomap", "histogram", "lineplot", "pie", "stacked", "treemap"]`

An array of the names of the kinds of charts the instance can generate.

### `className`
* Type: `string`
* **Optional**, default value: `undefined`

A classname for CSS styling.

### `datacap`
* Type: `number`
* **Optional**, default value: `20000`

The maximum number of data points the instance can use to generate a chart, reduce it if the chart rendering frozes the browser.  

### `defaultLocale`
* Type: `string`
* **Optional**, default value: `"en"`

If you implement another (or many) locale, this property sets the one shown initially.  

### `measureConfig`
* Type: `Record<string, D3plusConfig> | ((measure: OlapClient.Measure) => D3plusConfig)`
* **Optional**, default value: `{}`

Useful to set a specific d3plus config to use depending on the measure used in the query. The config parameters resulting from using this property have priority over all other config params determined by internal heuristic.  
This property accepts a function or an object. If a function is passed, it will be called with the relevant `olap-client` `Measure` instance object, and must return an object with the properties wanted to be merged to the chart config. If an object is passed, the value whose key matches the `measure.name` will be merged to the chart config.

### `onPeriodChange`
* Type: `(period: Date) => void`
* **Optional**, default value: `undefined`

A function that's called when the user picks a different time period in the timeline of a chart. The parameter passed is the Date object for the selected time period, and it doesn't need a value to be returned.

### `showConfidenceInt`
* Type: `boolean`
* **Optional**, default value: `false`

Toggles showing confidence intervals / margins of error when available in the query.

### `topojsonConfig`
* Type: `Record<string, D3plusConfig> | ((level: OlapClient.Level) => D3plusConfig)`
* **Optional**, default value: `{}`

Useful to set a specific d3plus config to use depending on the level used in the query.  
Can be passed a function or an object. If a function is passed, it will be called with the relevant `olap-client` `Level` instance object, which will be a geographic-type of level; it must return an object with the properties wanted to be assigned to the chart config. If instead an object is passed, the object value whose key matches with either `level.uniqueName`, `level.fullName`, or `level.name`, in that order, will be assigned to the chart config.

### `translations`
* Type: `Record<string, Translation>`
* **Optional**, default value: `{}`

An object with localization labels to use within the component. The keys are locale codes and the values are objects that comply with the [`Translation` interface](#interface-translation). This is an example of the structure:

```js
const translations = {
  "en": {
    action_apply: "Apply",
    action_back: "Back",
    action_close: "Close",
    ...
  },
  "es": {
    action_apply: "Aplicar",
    action_back: "Volver",
    action_close: "Cerrar",
    ...
  }
}
```

An example of the message keys is available [in this file](./src/toolbox/locale_en.js). These are also the default labels used if this parameter is not set, or if the [`defaultLocale`](#defaultlocale) parameter points to a locale not available.

### `userConfig`
* Type: `D3plusConfig`
* **Optional**, default value: `undefined`

A general use d3plus config object, which will be applied to all charts.

## Types and interfaces

The package has some typings set in TypeScript to help development. All these are also exported by the package. It is encouraged to use them to verify the structures are complying with the required properties.

### `type ChartType`
A string from the following list:

```ts
type ChartType =
  | "barchart"
  | "barchartyear"
  | "donut"
  | "geomap"
  | "histogram"
  | "lineplot"
  | "pie"
  | "stacked"
  | "treemap";
```

### `interface QueryResult`

An object with information about the cube where the info belongs to, the parameters used to execute the query, and the resulting dataset. This component is designed to work around the data structures defined on the `olap-client` package, so these properties can be easily obtained after executing a query with it. All properties are required.  
The `AdaptedCube` interface comes from `olap-client`, and can be obtained from a `Cube` instance calling the `cube.toJSON()` method. The dataset is the tidy data array returned by a `jsonrecords` query. The `QueryParams` interface is described next, and can be constructed from a `olap-client` `Query` instance.

```ts
interface QueryResult {
  cube: OlapClient.AdaptedCube;
  dataset: any[];
  params: QueryParams;
}
```

### `interface QueryParams`

The `QueryParams` interface describes the parameters used in the query, using raw objects, with the name of the property as identifier:

```ts
interface QueryParams {
  booleans: {
    [name: string]: boolean;
  };
  cuts: Array<{
    dimension?: string;
    hierarchy?: string;
    level: string;
    members: string[];
  }>;
  drilldowns: Array<{
    dimension?: string;
    hierarchy?: string;
    level: string;
    properties?: string[];
    caption?: string;
  }>;
  filters: Array<{
    comparison: string;
    formatter?: (value: number) => string;
    measure: string;
    value: string;
  }>;
  growth: Array<{
    measure: string;
    dimension?: string;
    hierarchy?: string;
    level: string;
  }>;
  measures: Array<{
    collection?: string;
    formatter?: (value: number) => string;
    lci?: string;
    measure: string;
    moe?: string;
    source?: string;
    uci?: string;
  }>;
}
```

Some remarks:

* All the higher level properties (`booleans`, `cuts`, `drilldowns`, `filters`, `growth`, and `measures`) must be present, but can be empty arrays.
* In the descriptor objects, those with a question mark (`?`) at the end of the property name are optional, but encouraged to avoid collisions.
* The `level` name used in the descriptor object can be the `uniqueName`, the `fullName`, or the `name` of the level; these three are matched in that order.
* The `members` property in the `cuts` descriptor items is an array of member `key`, for the members defined in the cut on that `level`.
* The `properties` property in the `drilldowns` descriptor items is an array of property `name`, belonging to the `level` defined along it. Likewise, the `caption` property is just a property `name`.
* The `formatter` property, if defined, should be a function that receives a `number` value, and outputs a `string`. This formatting function will be used wherever the values for the `measure` defined along it is shown.
* For each of the `measures` descriptor items, if a `moe` is defined, `lci` and `uci` won't be considered.

Notice the `QueryParams` object can also contain `Formatter` functions, so it can't be serialized and rehydrated from a JSON string. This is important if you plan to store the object in a Redux store, for example, as it can result in unexpected behavior when using some features.

For ease of development, this package also exports [a helper function `buildQueryParams`](#function-buildqueryparams) as a named export, to quickly convert an `olap-client` `Query` object into a `QueryParams` object. Check the definition below for details on how to use it.

### `interface Translation`

An object whose keys are message keys, and its values the localized string to show in the interface.

```ts
interface Translation {
  /* These are actions shown in buttons in the UI */
  "action_close": string;
  "action_enlarge": string;
  "action_retry": string;
  "action_fileissue": string;

  /* These labels are shown in the charts tooltip */
  "chart_labels": {
    "ci": string;
    "collection": string;
    "moe": string;
    "source": string;
  };

  /* These labels are shown in the suggested error message when filing a new issue */
  "error": {
    "detail": string;
    "message": string;
    "title": string;
  };
}
```

### `namespace Struct`

The types defined in the `Struct` namespace are for private use and might change between versions. Changes in these are not considered for semver version bumps, only the previously described.

## Additional Tools

### `function buildQueryParams()`

Creates a `QueryParams` object from a `olap-client` `Query` object. The function has the following shape:

```ts
function buildQueryParams(
  query: OlapClient.Query,
  formatters?:
    | Record<string, (value: number) => string>
    | (measure: OlapClient.Measure | "growth" | "rca") => (value: number) => string
): QueryParams;
```

The `formatters` parameter behaves similarly to the [`measureConfig`](#measureconfig) property from the Vizbuilder component: it can receive either
* an object, whose keys are measure names from the cube, and `Formatter` functions as values, or
* a function whose first parameter is an `olap-client` `Calculation` (which means, it can be either a `Measure` object, or one of the strings `"growth"` and `"rca"`), which must return a `Formatter` function for these values.

An example implementation would be:

```js
import {buildQueryParams} from "@datawheel/vizbuilder";

[...]

const agg = await client.execQuery(query);
return {
  cube: cube.toJSON(),
  dataset: agg.data,
  params: buildQueryParams(agg.query, {
    "Total value": dollarFormatter,
    "Average value": dollarFormatter
  })
}

[...]
```

## License

© 2019 [Datawheel, LLC](https://datawheel.us/)  
This project is made available under the [MIT License](./LICENSE).
