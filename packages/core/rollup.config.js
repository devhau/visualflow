import { terser } from "rollup-plugin-terser";
import pluginTypescript from "@rollup/plugin-typescript";
import pluginCommonjs from "@rollup/plugin-commonjs";
import pluginNodeResolve from "@rollup/plugin-node-resolve";
import { babel } from "@rollup/plugin-babel";
import scss from 'rollup-plugin-scss'
import * as path from "path";
import pkg from "./package.json";

const moduleName = pkg.name.replace("@", "").replace("/", "_");
const inputFileName = "src/index.ts";
const author = pkg.author;
const banner = `
  /**
   * @license
   * author:${author.email} (${author.name})
   * ${moduleName}.js v${pkg.version}
   * Released under the ${pkg.license} license.
   */
`;

export default [
  {
    input: "src/index.scss",
    plugins: [
      scss({
        output: `${pkg.browser.replace(".js", "")}.css`,
        banner
      })
    ]

  },
  {
    input: "src/index.scss",
    plugins: [
      scss({
        output: `${pkg.browser.replace(".js", "")}.mini.css`,
        outputStyle: 'compressed',
        banner
      })
    ]

  },
  {
    input: inputFileName,
    output: [
      {
        name: moduleName,
        file: pkg.browser,
        format: "iife",
        sourcemap: "inline",
        banner,
      },
      {
        name: moduleName,
        file: pkg.browser.replace(".js", ".min.js"),
        format: "iife",
        sourcemap: "inline",
        banner,
        plugins: [terser()],
      },
    ],
    plugins: [
      pluginTypescript(),
      pluginCommonjs({
        extensions: [".js", ".ts"],
      }),
      babel({
        babelHelpers: "bundled",
        configFile: path.resolve(__dirname, ".babelrc.js"),
      }),
      pluginNodeResolve({
        browser: true,
      }),
    ],
  },

  // ES
  {
    input: inputFileName,
    output: [
      {
        file: pkg.module,
        format: "es",
        sourcemap: "inline",
        banner,
        exports: "named",
      },
    ],
    external: [
      ...Object.keys(pkg.dependencies || {}),
      ...Object.keys(pkg.devDependencies || {}),
    ],
    plugins: [
      pluginTypescript(),
      pluginCommonjs({
        extensions: [".js", ".ts"],
      }),
      babel({
        babelHelpers: "bundled",
        configFile: path.resolve(__dirname, ".babelrc.js"),
      }),
      pluginNodeResolve({
        browser: false,
      }),
    ],
  },

  // CommonJS
  {
    input: inputFileName,
    output: [
      {
        file: pkg.main,
        format: "cjs",
        sourcemap: "inline",
        banner,
        exports: "default",
      },
    ],
    external: [
      ...Object.keys(pkg.dependencies || {}),
      ...Object.keys(pkg.devDependencies || {}),
    ],
    plugins: [
      pluginTypescript(),
      pluginCommonjs({
        extensions: [".js", ".ts"],
      }),
      babel({
        babelHelpers: "bundled",
        configFile: path.resolve(__dirname, ".babelrc.js"),
      }),
      pluginNodeResolve({
        browser: false,
      }),
    ],
  },
];
