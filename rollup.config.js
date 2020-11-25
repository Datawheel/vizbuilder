import babel from "@rollup/plugin-babel";
import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import replace from "@rollup/plugin-replace";
import cleanup from "rollup-plugin-cleanup";
import {terser} from "rollup-plugin-terser";
import pkg from "./package.json";

const environment = process.env.NODE_ENV;
const inDevelopment = environment === "development";
const inProduction = environment === "production";

const extPackages = Object.keys({...pkg.dependencies, ...pkg.peerDependencies});
const sourcemap = inDevelopment ? "hidden" : false;

/** @return {import("rollup").RollupOptions} */
export default commandLineArgs => ({
  input: "src/index.js",
  output: [
    {
      file: pkg.main,
      format: "cjs",
      assetFileNames: "[name][extname]",
      exports: "named",
      sourcemap
    },
    {
      file: pkg.module,
      format: "esm",
      assetFileNames: "[name][extname]",
      exports: "named",
      sourcemap
    }
  ],
  plugins: [
    replace({
      ENVIRONMENT: JSON.stringify(environment)
    }),
    resolve({
      extensions: [".mjs", ".js", ".jsx"],
      preferBuiltins: true
    }),
    babel({
      babelHelpers: "runtime",
      exclude: "node_modules/**"
    }),
    commonjs({
      include: ["node_modules/**"]
    }),
    inProduction && terser(),
    cleanup()
  ],
  external: id => extPackages.some(pkg => id.startsWith(pkg)),
  watch: {
    include: ["src/**"],
    exclude: "node_modules/**",
    clearScreen: !inProduction
  }
});
