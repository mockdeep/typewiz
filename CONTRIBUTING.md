# Contributing Guide

Thank you for considering a contribution to TypeWiz!

When making a non-trivial change to this repository (such as adding a new functionality), 
please first discuss the change you wish to make via issue before making the change. 

## Background

Before contibuting, it's advised to read the [blog post explaining how the project works](https://medium.com/p/diving-into-the-internals-of-typescript-how-i-built-typewiz-d273bbef3565). 
This will give you a good understanding of the different parts of the project.

## Finding an issue to work on

You if you interested in contributing and looking for an issue to work on, check out the issues labeled [help wanted](https://github.com/urish/typewiz/issues?q=is%3Aopen+is%3Aissue+label%3A%22help+wanted%22).

## Tests, Lint and Formatting

Please create a test case for any feature you add or bug you fix. The [integration tests](packages/typewiz-core/src/integration.spec.ts) are quite simple. You simply need to provide the input TypeScript source code and the expected output (with the added type annotations).

To run the tests (and linting) execute:

    yarn test
    
The code is formatted using prettier. You can (and should) format your code before committing by running:

    yarn format
    
The project provides [Wallaby.js](https://wallabyjs.com/) configuration, you can use it to automatically run the tests in your IDE as you edit the code.

## Testing TypeWiz on a Node.js project using [typewiz-node](packages/typewiz-node)

If you make some changes to TypeWiz and wish to test them on a Node.js project, you can follow these steps:

1. Clone typewiz, run `yarn install`and make some changes
2. Run `yarn build` inside the typewiz directory
4. Run your project's entry point with typewiz-node, e.g. `yarn typewiz-node index.ts`

Whenever you make any changes to typewiz and want to test them, simply run `yarn build` in the typewiz directory again.

## Project structure

- [packages/typewiz-core](packages/typewiz-core) - Core typewiz library
- [packages/typewiz-node](packages/typewiz-node) - Node JS runner
- [packages/typewiz-webpack](packages/typewiz-webpack) - Webpack Loader + Plugin

## License

All contributed code will be licensed under the MIT license. By submitting a pull-request you are agreeing to publish your code under this license.
