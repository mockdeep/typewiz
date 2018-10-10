# typewiz-angular

An Angular Schematic that automatically adds types to TypeScript code using [TypeWiz](https://www.npmjs.com/package/typewiz-core)

[![Build Status](https://travis-ci.org/urish/typewiz.png?branch=master)](https://travis-ci.org/urish/typewiz)
[![Coverage Status](https://coveralls.io/repos/github/urish/typewiz/badge.svg?branch=master)](https://coveralls.io/github/urish/typewiz?branch=master)

## Installation

Run the following command in your project's folder:

```
ng add typewiz-angular
```

## Usage

Start your project normally, by running `ng serve`. You should see a new `collected-types.json` file, which will contain all the new types discovered by TypeWiz. To update your source code with these types, run the following command:

```
npm run typewiz:apply-types
```

For more information, check out [the blog post]().

## Example

Given the following input file:

```typescript
export class AppComponent {
    title = this.greet('World');

    greet(who) {
        return `Hello, ${who}`;
    }
}
```

After running the app with `ng serve`, opening it in the browser, and then applying the discovered types by running `npm run typewiz:apply-types`, your class will be updated as follows:

```typescript
export class AppComponent {
  title = this.greet('World');

  greet(who: string) {
      return `Hello, ${who}`;
  }
}
```

Note the addition of the `: string` type for the `who` of the `greet` method.

## License

Copyright (C) 2018, Uri Shaked and contributors. Distributed under the terms of the MIT license.
