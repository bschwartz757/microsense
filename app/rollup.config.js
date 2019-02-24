import commonjs from "rollup-plugin-commonjs";
import eslint from "rollup-plugin-eslint";
import resolve from "rollup-plugin-node-resolve";
import postcss from "rollup-plugin-postcss";
import svelte from "rollup-plugin-svelte";

import pkg from "./package.json";
const production = !process.env.ROLLUP_WATCH;

export default {
  input: "src/main.js",
  output: [
    {
      sourcemap: true,
      format: "iife",
      name: "app",
      file: pkg.main
    },
    {
      sourcemap: true,
      format: "es",
      name: "app",
      file: pkg.module
    }
  ],
  plugins: [
    eslint({
      include: ["./src/**/*.js"]
    }),
    svelte({
      // enable run-time checks when not in production
      dev: !production
    }),
    postcss({
      extensions: [".css", ".scss"],
      // `extract: false` will automatically inject all styles into <head> tag
      extract: "./public/css/bundle.css"
      // modules: true
    }),
    resolve(),
    commonjs({
      include: "node_modules/**"
    }),
  ]
};
