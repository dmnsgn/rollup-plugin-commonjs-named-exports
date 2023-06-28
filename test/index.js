import test from "node:test";
import assert from "node:assert";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

import { rollup } from "rollup";
import commonjs from "@rollup/plugin-commonjs";

import commonjsNamedExports from "../index.js";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

test("should return re-exports", async (t) => {
  const bundle = await rollup({
    input: join(__dirname, "fixtures-named-re-exports.js"),
    plugins: [commonjs(), commonjsNamedExports()],
  });

  const result = await bundle.generate({
    exports: "auto",
  });

  assert.deepStrictEqual(result.output[0].exports, ["answer", "default"]);
});
