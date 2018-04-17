# TypeWiz
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

## Installation

This package provides a Command Line Interface (CLI) for working working with TypeWiz. If you are looking to use TypeWiz with WebPack, check out [the TypeWiz WebPack Plugin](https://www.npmjs.com/package/typewiz-webpack). For node.js integration please check out [the typewiz-node runner](https://www.npmjs.com/package/typewiz-node).

Install the TypeWiz CLI by running the following command:

    yarn global add typewiz

or

    npm install -g typewiz

## Usage

### Calculate Your Type Coverage

Use the `coverage` command and point it at your project's `tsconfig.json` to calculate and display the type coverage:

```bash
typewiz coverage /path/to/projec/tsconfig.json
```

The output looks similar to this:

```
12236 of 13298 types are known.
Your type coverage is: 92.01%
```

The percentage represent the amount of identifier in the code whose type is known - i.e. that have a specific type (or such type could be inferred by TypeScript) which is not `any`. The higher the better. You can improve this number by adding more types to your code, for instance by using TypeWiz. This metric allows you to measure your progress in adding new types to your TypeScript project.

### Instrument Your Code 

TypeWiz works by [instrumenting your code](https://medium.com/@urish/diving-into-the-internals-of-typescript-how-i-built-typewiz-d273bbef3565) and adding special code that tracks the type you pass to functions on run time. In most cases, the you will use one of the existing integrations that will take care of instrumenting for you. 

In some scenarios, for example, when an integration with your tool chain does not exist yet, you will want to instrument your code manually using the `instrument` command:

```bash
typewiz instrument -i myFile.ts
```

The above command will instrument `myFile.ts` and write the result in place, overwriting the original input file. You can remove the `-i` flag to output the instrumented source code to the standard output, or change it to `-o filename.ts` to write the output to a different file.

### Apply discovered types

After you ran your instrumented code, you will have to collect the discovered types and save them to a file so you can add them to your code using the `applyTypes` command. This is not required when you use the Node.js integration, as it already adds the types for you. When you use other integrations, such as the Webpack plugin, the discovered types will be written to a file on disk, and you can use the CLI to add them to your code:

```bash
typewiz applyTypes collected-types.json
```

You can also specify a prefix that will be prepended to all the types added to your code, to distinguish them
from the existing types. For instance:

```bash
typewiz applyTypes -p /*typewiz*/ collected-types.json
```

will result in `/*typewiz*/` appearing before each discovered type, e.g.:

```typescript
function add(a: /*typewiz*/number, b: /*typewiz*/number) {
    return a + b;
}
add(5, 6);
```

This can also be useful for quickly switching the discovered types on/off, a technique discusssed [in the blog post](https://medium.com/@urish/manual-typing-is-no-fun-introducing-typewiz-58e3e8813f4c#adaa).

### Specifying configuration file

You can specify a TypeWiz configuration file using the `-c` argument, for instance:

```bash
typewiz -c my-typewiz-conf.json instrument myScript.ts
```

This can be useful to override some defaults - see the [Configuration Options](https://github.com/urish/typewiz/blob/master/README.md#configuration-options) section for additiona details. If not configuration file is specified, typewiz will try to read the configuration from a file called `typewiz.json` if such file exists in the current directory or any of its ancestors.

## License

Copyright (C) 2018, Uri Shaked. Licensed under the MIT license.
