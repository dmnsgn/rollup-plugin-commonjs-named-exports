import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

import * as cjsModuleLexer from "cjs-module-lexer";
import isValidIdentifier from "is-valid-identifier";

await cjsModuleLexer.init();

const PLUGIN_NAME = "commonjs-named-exports";
const SUFFIX = `?${PLUGIN_NAME}`;

const isValidNamedExport = (name) =>
  name !== "default" && name !== "__esModule" && isValidIdentifier(name);

// TODO: should visited be by invocation?
// "?commonjs-named-exports?commonjs-named-exports" can appear
const getCjsNamedExports = (filename, visited = new Set()) => {
  if (visited.has(filename)) return [];

  const isMainEntrypoint = visited.size === 0;
  visited.add(filename);

  try {
    const source = readFileSync(filename, "utf8");

    // isCJS: https://github.com/rollup/plugins/blob/639f45638234c1c3fabfb13615c78bebaef89ef2/packages/commonjs/src/parse.js#L12
    if (
      // fast negative: no CJS keywords (require, module, exports) present
      !/\b(?:require|module|exports)\b/.test(source) ||
      // has ESM static import/export declarations
      /(?:^|\n)\s*(?:import\s|import\(|export\s|export\{)/.test(source)
    ) {
      return isMainEntrypoint ? null : [];
    }

    const { exports, reexports } = cjsModuleLexer.parse(source);

    const resolvedReexports = reexports.length
      ? reexports
          .map((reexport) =>
            getCjsNamedExports(
              createRequire(filename).resolve(reexport),
              visited,
            ),
          )
          .flat(Infinity)
          .filter(Boolean)
      : [];

    const resolvedExports = Array.from(
      new Set([...exports, ...resolvedReexports]),
    ).filter(isValidNamedExport);

    return isMainEntrypoint && resolvedExports.length === 0
      ? null
      : resolvedExports;
  } catch (error) {
    // parse failure = not analyzable as CJS, treat as no exports
    console.debug(`${PLUGIN_NAME} ${filename}: ${error.message}`);
  }
};

const namedExportsCache = new Map();

/** @returns {import("rolldown").Plugin} */
export default () => ({
  name: PLUGIN_NAME,
  async resolveId(source, importer, options) {
    if (options.isEntry) {
      const resolution = await this.resolve(source, importer, {
        skipSelf: true,
        ...options,
      });
      if (!resolution || resolution.external) return resolution;

      // getCjsNamedExports returns null when no static CJS exports are found
      // (either ESM or fully-dynamic CJS). Only wrap when there are named exports.
      const namedExports = getCjsNamedExports(resolution.id);
      if (namedExports == null) return resolution;

      namedExportsCache.set(resolution.id, namedExports);
      return `${resolution.id}${SUFFIX}`;
    }
    return null;
  },
  load(id) {
    if (id.endsWith(SUFFIX)) {
      const entryId = id.slice(0, -SUFFIX.length);

      const code = readFileSync(entryId, "utf8");
      let shebang = "";
      if (code.startsWith("#!")) {
        const shebangEndPosition = code.indexOf("\n") + 1;
        shebang = code.slice(0, shebangEndPosition);
      }

      const file = JSON.stringify(entryId);
      const uniqueNamedExports = namedExportsCache.get(entryId) || [];
      let result = `${shebang}export * from ${file};`;
      result += `export { default } from ${file};`;
      if (uniqueNamedExports.length) {
        result += `export { ${uniqueNamedExports.join(",")} } from ${file};`;
      }
      return result;
    }
    return null;
  },
});
