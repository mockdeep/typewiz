## TypeWiz
Automatically discover and add missing types in your TypeScript code.

<img src="https://github.com/urish/typewiz/blob/master/assets/typewiz.png?raw=true" alt="TypeWiz"/>

[![Build Status](https://travis-ci.org/urish/typewiz.png?branch=master)](https://travis-ci.org/urish/typewiz)
[![Coverage Status](https://coveralls.io/repos/github/urish/typewiz/badge.svg?branch=master)](https://coveralls.io/github/urish/typewiz?branch=master)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)

## Introduction

TypeWiz monitors your variable types in runtime, and uses this information to add missing type annotations to your
TypeScript code. For instance, given the following source code as input:

```typescript
function add(a, b) {
    return a + b;
}
add(5, 6);
```

TypeWiz will automatically detect the types of `a` and `b` as `number`, and will rewrite to code to read:

```typescript
function add(a: number, b: number) {
    return a + b;
}
add(5, 6);
```

You can learn more about the project in the blog posts:

* [Manual Typing is No Fun: Introducing TypeWiz!](https://medium.com/@urish/manual-typing-is-no-fun-introducing-typewiz-58e3e8813f4c)
* [Diving into the Internals of TypeScript: How I Built TypeWiz](https://medium.com/@urish/diving-into-the-internals-of-typescript-how-i-built-typewiz-d273bbef3565)

## Usage

For front-end code, please have a look at the [TypeWiz WebPack Plugin](packages/typewiz-webpack/README.md).

For node.js code, please check out the [typewiz-node Runner](packages/typewiz-node/README.md).

To use TypeWiz from the command line try the [TypeWiz CLI](packages/typewiz/README.md).

If you are interested in creating your own custom integration, see the [Integration Test](packages/typewiz-core/src/integration.spec.ts) 
for an example how to directly use the TypeWiz API. You can use the API directly by adding this library to your project:

    yarn add -D typewiz-core

or

    npm install --save-dev typewiz-core

## Configuration options

Configuration options can be specified using the `typewiz.json` configuration file. This file is used by `typewiz-node`
and `typewiz-webpack` and can be parsed using the `ConfigurationParser` class in `typewiz-core` for custom integrations.

The `typewiz.json` file has the following format:
```json
{
    "common":{
        "rootDir":".",
        "tsConfig":"tsconfig.json"
    },
    "instrument":{
        "instrumentCallExpressions":true,
        "instrumentImplicitThis":true,
        "skipTwizDeclarations":true
    },
    "applyTypes":{
        "prefix":"TypeWiz |"
    }
}
```

Options:
* `rootDir: string` (default: undefined) - If given, all the file paths in the collected type info will be resolved relative to this directory.
* `tsConfig: string` (default: undefined) - The path to your project's tsconfig.json file. 
    This is required for several other options, like instrumenting implicit this and type inference using static analysis.

* `instrumentCallExpressions: boolean` (default: false) - Try to find even more types by combining static analysis with
    the runtime analysis. TypeWiz will try to use TypeScript's inferred types when determining the type of a function argument. See [#27](https://github.com/urish/typewiz/pull/27) for an example.
* `instrumentImplicitThis: boolean` (default: false) - Find type of `this` in non-class member functions. See [#33](https://github.com/urish/typewiz/issues/33) for discussion.
* `skipTwizDeclarations: boolean` (default: false) - Don't add a declaration of $_$twiz to instrumented files.

* `prefix: string` (default: '') - A prefix to add before each type added by `applyTypes()`. See [#11](https://github.com/urish/typewiz/issues/11).

## License

Copyright (C) 2018, Uri Shaked. Licensed under the MIT license.
