<img src="https://github.com/kaminskypavel/typewiz/blob/master/assets/typewiz.png?raw=true" alt="TypeWiz"/>

Automatically discover and add missing types in your TypeScript code

[![Build Status](https://travis-ci.org/urish/typewiz.png?branch=master)](https://travis-ci.org/urish/typewiz)
[![Coverage Status](https://coveralls.io/repos/github/urish/typewiz/badge.svg?branch=master)](https://coveralls.io/github/urish/typewiz?branch=master)

## Install

    yarn global add typewiz

or

    npm install --global typewiz

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

## Usage

For front-end code, please have a look at the [TypeWiz WebPack Plugin](packages/typewiz-webpack/README.md).

For node.js code, please check out the [typewiz-node Runner](packages/typewiz-node/README.md).

If you are interested in creating your own custom integration, see the [Integration Test](src/integration.spec.ts) 
for an example how to directly use the TypeWiz API.

## License

Copyright (C) 2018, Uri Shaked. Licensed under the MIT license.
