# rollup-plugin-commonjs-named-exports

[![npm version](https://img.shields.io/npm/v/rollup-plugin-commonjs-named-exports)](https://www.npmjs.com/package/rollup-plugin-commonjs-named-exports)
[![stability-stable](https://img.shields.io/badge/stability-stable-green.svg)](https://www.npmjs.com/package/rollup-plugin-commonjs-named-exports)
[![npm minzipped size](https://img.shields.io/bundlephobia/minzip/rollup-plugin-commonjs-named-exports)](https://bundlephobia.com/package/rollup-plugin-commonjs-named-exports)
[![dependencies](https://img.shields.io/librariesio/release/npm/rollup-plugin-commonjs-named-exports)](https://github.com/dmnsgn/rollup-plugin-commonjs-named-exports/blob/main/package.json)
[![types](https://img.shields.io/npm/types/rollup-plugin-commonjs-named-exports)](https://github.com/microsoft/TypeScript)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-fa6673.svg)](https://conventionalcommits.org)
[![styled with prettier](https://img.shields.io/badge/styled_with-Prettier-f8bc45.svg?logo=prettier)](https://github.com/prettier/prettier)
[![linted with eslint](https://img.shields.io/badge/linted_with-ES_Lint-4B32C3.svg?logo=eslint)](https://github.com/eslint/eslint)
[![license](https://img.shields.io/github/license/dmnsgn/rollup-plugin-commonjs-named-exports)](https://github.com/dmnsgn/rollup-plugin-commonjs-named-exports/blob/main/LICENSE.md)

Re-export CommonJS named exports using Node.js cjs-module-lexer.

[![paypal](https://img.shields.io/badge/donate-paypal-informational?logo=paypal)](https://paypal.me/dmnsgn)
[![coinbase](https://img.shields.io/badge/donate-coinbase-informational?logo=coinbase)](https://commerce.coinbase.com/checkout/56cbdf28-e323-48d8-9c98-7019e72c97f3)
[![twitter](https://img.shields.io/twitter/follow/dmnsgn?style=social)](https://twitter.com/dmnsgn)

Useful to allow `import { Fragment, useState } from "react";` (instead of forcing `import React from "react";`) instance for a bundled React as the source package still re-exports its CJS named exports based on `process.env.NODE_ENV`:

```cjs
// react/index.js
if (process.env.NODE_ENV === "production") {
  module.exports = require("./cjs/react.production.min.js");
} else {
  module.exports = require("./cjs/react.development.js");
}
// react/cjs/react.development.js
// ...
exports.Fragment = REACT_FRAGMENT_TYPE;
exports.useReducer = useReducer;
exports.useRef = useRef;
exports.useState = useState;
// ...
```

Based on [esinstall](https://github.com/FredKSchott/snowpack/blob/main/esinstall/src/rollup-plugins/rollup-plugin-wrap-install-targets.ts) and [jspm-rollup](https://github.com/jspm/rollup-plugin-jspm/blob/main/jspm-rollup.js).

## Installation

```bash
npm install rollup-plugin-commonjs-named-exports
```

## Usage

Create a `rollup.config.js` [configuration file](https://www.rollupjs.org/guide/en/#configuration-files) and import the plugin:

```js
import commonjs from "@rollup/plugin-commonjs";
import commonjsNamedExports from "rollup-plugin-commonjs-named-exports";

export default {
  input: "src/index.js",
  output: {
    dir: "output",
  },
  plugins: [commonjs(), commonjsNamedExports()],
};
```

Then call `rollup` either via the [CLI](https://www.rollupjs.org/guide/en/#command-line-reference) or the [API](https://www.rollupjs.org/guide/en/#javascript-api).

## License

MIT. See [license file](https://github.com/dmnsgn/rollup-plugin-commonjs-named-exports/blob/main/LICENSE.md).
