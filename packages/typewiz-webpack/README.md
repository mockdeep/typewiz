# typewiz-webpack

WebPack plugin that automatically adds types to TypeScript code using [typewiz](https://www.npmjs.com/package/typewiz)

[![Build Status](https://travis-ci.org/urish/typewiz.png?branch=master)](https://travis-ci.org/urish/typewiz)
[![Coverage Status](https://coveralls.io/repos/github/urish/typewiz/badge.svg?branch=master)](https://coveralls.io/github/urish/typewiz?branch=master)

## Installation

First, install the plugin:

    yarn add typewiz-webpack

or

    npm install --save typewiz-webpack

Then, add `typewiz-webpack` to your list of loaders, just after your usual TypeScript loader. e.g.:

```javascript
  module: {
    loaders: [
      {
        test: /\.tsx?$/,
        loaders: ['awesome-typescript-loader', 'typewiz-webpack']
      }
    ]
  },
```

Next, add `TypewizPlugin` to your list of plugins, and configure
your webpack-dev-server to save the collected type info to disk using the provided `typewizCollectorMiddleware` middleware. Here is an example of what your final config file may look like:

```javascript
const { CheckerPlugin } = require('awesome-typescript-loader');
const { TypewizPlugin, typewizCollectorMiddleware } = require('typewiz-webpack');

module.exports = {
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx']
  },

  devtool: 'source-map',

  module: {
    loaders: [
      {
        test: /\.tsx?$/,
        loaders: ['awesome-typescript-loader', 'typewiz-webpack']
      }
    ]
  },

  plugins: [
    new CheckerPlugin(),
    new TypewizPlugin()
  ],

  devServer: {
    before: function(app) {
      typewizCollectorMiddleware(app, 'collected-types.json');
    }
  }
};
```

Finally, run your app with webpack. The collected type information will be saved to disk inside `collected-types.json`. This type information can be passed to the `applyTypes()` method from `typewiz` to apply the types to your source code.

## Example

Given the following input file:

```typescript
function greet(who) {
    return `Hello, ${who}`;
}

console.log(greet('Uri'));
```

After instrumenting the code with the plugin, collecting the types and applying them, you will get the following result:

```typescript
function greet(who: string) {
    return `Hello, ${who}`;
}

console.log(greet('Uri'));
```

Note the addition of the `: string` type for the `who` parameter in the first line.

## License

MIT
