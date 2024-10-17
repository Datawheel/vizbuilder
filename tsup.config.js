// @ts-check
import {defineConfig} from "tsup";

export default defineConfig(options => ({
  clean: !options.watch,
  entry: ["src/charts/index.ts", "src/react/index.ts"],
  format: ["cjs", "esm"],
  outExtension({format}) {
    return {js: `.${format}.js`};
  },
  dts: true,
  shims: true,
  sourcemap: !!options.watch,
  splitting: false,
  treeshake: true,
}));
