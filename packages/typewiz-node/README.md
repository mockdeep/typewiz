# typewiz-node

Automatically add types to node.js TypeScript code using [typewiz](https://www.npmjs.com/package/typewiz)

[![Build Status](https://travis-ci.org/urish/typewiz.png?branch=master)](https://travis-ci.org/urish/typewiz)
[![Coverage Status](https://coveralls.io/repos/github/urish/typewiz/badge.svg?branch=master)](https://coveralls.io/github/urish/typewiz?branch=master)

## Installation

    yarn global add typewiz-node

or

    npm install -g typewiz-node

## Usage

    typewiz-node <main.ts>

## Example

Given the following input file:

```typescript
function greet(who) {
    return `Hello, ${who}`;
}

console.log(greet('Uri'));
```

Typewiz will run the program and then the code will be updated as following:

```typescript
function greet(who: string) {
    return `Hello, ${who}`;
}

console.log(greet('Uri'));
```

Note the addition of the `: string` type for the `who` parameter in the first line.

## License

MIT
