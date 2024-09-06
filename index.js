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
    const { exports, reexports } = cjsModuleLexer.parse(
      readFileSync(filename, "utf8"),
    );

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
    console.warn(`${PLUGIN_NAME} ${filename}: ${error.message}`);
  }
};

/** @type {import("rollup").PluginImpl} */
export default () => ({
  name: PLUGIN_NAME,
  async resolveId(source, importer, options) {
    if (options.isEntry) {
      const resolution = await this.resolve(source, importer, {
        skipSelf: true,
        ...options,
      });
      if (!resolution || resolution.external) return resolution;

      await this.load(resolution);

      return `${resolution.id}${SUFFIX}`;
    }
    return null;
  },
  load(id) {
    if (id.endsWith(SUFFIX)) {
      const entryId = id.slice(0, -SUFFIX.length);

      const { hasDefaultExport, meta, code } = this.getModuleInfo(entryId);

      let shebang = "";
      if (code.startsWith("#!")) {
        const shebangEndPosition = code.indexOf("\n") + 1;
        shebang = code.slice(0, shebangEndPosition);
      }

      const file = JSON.stringify(entryId);
      let result = `${shebang}export * from ${file};`;
      if (hasDefaultExport) result += `export { default } from ${file};`;

      if (meta?.commonjs?.isCommonJS) {
        const uniqueNamedExports = getCjsNamedExports(entryId) || [];
        if (uniqueNamedExports.length) {
          result += `export { ${uniqueNamedExports.join(",")} } from ${file};`;
        }
      }
      return result;
    }
    return null;
  },
});
