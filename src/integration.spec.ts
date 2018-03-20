import * as fs from 'fs';
import * as ts from 'typescript';
import * as vm from 'vm';

import { transpileSource, virtualCompilerHost } from './test-utils/transpile';

const mockFs = {
    readFileSync: jest.fn(fs.readFileSync),
    writeFileSync: jest.fn(fs.writeFileSync),
};
jest.doMock('fs', () => mockFs);

import { applyTypes, getTypeCollectorSnippet, IApplyTypesOptions, instrument } from './index';

function typeWiz(input: string, typeCheck = false, options?: IApplyTypesOptions) {
    // Step 1: instrument the source
    const instrumented = instrument(input, 'c:\\test.ts', { instrumentCallExpressions: true });

    // Step 2: compile + add the type collector
    const compiled = typeCheck ? transpileSource(instrumented, 'test.ts') : ts.transpile(instrumented);

    // Step 3: evaluate the code, and collect the runtime type information
    const collectedTypes = vm.runInNewContext(getTypeCollectorSnippet() + compiled + ';$_$twiz.get();');

    // Step 4: put the collected typed into the code
    mockFs.readFileSync.mockReturnValue(input);
    mockFs.writeFileSync.mockImplementationOnce(() => 0);

    if (options && options.tsConfig) {
        options.tsCompilerHost = virtualCompilerHost(input, 'c:/test.ts');
        options.tsConfigHost = {
            fileExists: ts.sys.fileExists,

            // readDirectory will be called by applyTypes to get the names of files included in
            // the typescript project. We return a mock value with our test script path.
            readDirectory: () => ['c:/test.ts'],

            // readFile will be called to read the compiler options from tsconfig.json, so we mock
            // it to return a basic configuration that will be used during the integration tests
            readFile: jest.fn(() =>
                JSON.stringify({
                    compilerOptions: {
                        target: 'es2015',
                    },
                    include: ['test.ts'],
                }),
            ),
            useCaseSensitiveFileNames: ts.sys.useCaseSensitiveFileNames,
        };
    }

    applyTypes(collectedTypes, options);

    if (options && options.tsConfig) {
        expect(options.tsConfigHost.readFile).toHaveBeenCalledWith(options.tsConfig);
    }

    if (mockFs.writeFileSync.mock.calls.length) {
        expect(mockFs.writeFileSync).toHaveBeenCalledTimes(1);
        expect(mockFs.writeFileSync).toHaveBeenCalledWith('c:\\test.ts', expect.any(String));
        return mockFs.writeFileSync.mock.calls[0][1];
    } else {
        return null;
    }
}

beforeEach(() => {
    mockFs.readFileSync.mockImplementation(fs.readFileSync);
    jest.clearAllMocks();
});

describe('function parameters', () => {
    it('should infer `string` type for a simple function', () => {
        const input = `
            function greet(c) {
                return 'Hello ' + c;
            }
            greet('World');
        `;

        expect(typeWiz(input, true)).toBe(`
            function greet(c: string) {
                return 'Hello ' + c;
            }
            greet('World');
        `);
    });

    it('should find argument types for arrow functions', () => {
        const input = `((x) => { return x + 5; })(10)`;

        expect(typeWiz(input)).toBe(`((x: number) => { return x + 5; })(10)`);
    });

    it('should find argument types for arrow function expressions', () => {
        const input = `((x)=>x+5)(10)`;
        expect(typeWiz(input)).toBe(`((x: number)=>x+5)(10)`);
    });

    it('should correcly handle arrow functions without parenthesis around the argument names', () => {
        const input = `(async x=>x+5)(10)`;
        expect(typeWiz(input)).toBe(`(async (x: number)=>x+5)(10)`);
    });

    it('should infer `string` type for class method', () => {
        const input = `
            class Greeter {
                greet(who) {
                    return 'Hello, ' + who;
                }
            }
            new Greeter().greet('World');
        `;

        expect(typeWiz(input)).toBe(`
            class Greeter {
                greet(who: string) {
                    return 'Hello, ' + who;
                }
            }
            new Greeter().greet('World');
        `);
    });

    it('should infer `string` type for object literal method', () => {
        const input = `
            const greeter = {
                greet(who) {
                    return 'Hello, ' + who;
                }
            }
            greeter.greet('World');
        `;

        expect(typeWiz(input)).toBe(`
            const greeter = {
                greet(who: string) {
                    return 'Hello, ' + who;
                }
            }
            greeter.greet('World');
        `);
    });

    it('should correctly handle optional parameters', () => {
        const input = `
            function calculate(a, b?) {
                return a + (b || 0);
            }
            calculate(5, 6);
        `;

        expect(typeWiz(input)).toBe(`
            function calculate(a: number, b?: number) {
                return a + (b || 0);
            }
            calculate(5, 6);
        `);
    });

    it('should keep unused functions as is', () => {
        const input = `
            function unused(foo, bar) {
            }
        `;

        expect(typeWiz(input)).toBe(null); // null means we haven't updated the input file
    });

    it('should support union types', () => {
        const input = `
            function commas(item) {
                return Array.from(item).join(', ');
            }
            commas('Lavender');
            commas(['Apples', 'Oranges']);
        `;

        expect(typeWiz(input)).toBe(`
            function commas(item: string|string[]) {
                return Array.from(item).join(', ');
            }
            commas('Lavender');
            commas(['Apples', 'Oranges']);
        `);
    });

    it('should should not append `undefined` type to optional parameters', () => {
        const input = `
            function optional(b?, c?) {
                return b || 0;
            }
            optional() + optional(10);
        `;

        expect(typeWiz(input)).toBe(`
            function optional(b?: number, c?) {
                return b || 0;
            }
            optional() + optional(10);
        `);
    });

    it('should use TypeScript inference to find argument types', () => {
        const input = `
            function f(a) {
            }

            const arr: string[] = [];
            f(arr);
        `;

        expect(typeWiz(input, false, { tsConfig: 'tsconfig.integration.json' })).toBe(`
            function f(a: string[]) {
            }

            const arr: string[] = [];
            f(arr);
        `);
    });

    it('should discover generic types using Type Inference', () => {
        const input = `
            function f(a) {
                return a;
            }

            const promise = Promise.resolve(15);
            f(promise);
        `;

        expect(typeWiz(input, false, { tsConfig: 'tsconfig.integration.json' })).toBe(`
            function f(a: Promise<number>) {
                return a;
            }

            const promise = Promise.resolve(15);
            f(promise);
        `);
    });
});

describe('class fields', () => {
    it('should detect `boolean` type for class field', () => {
        const input = `
            class Test {
                passed;
            }
            new Test().passed = true;
        `;

        expect(typeWiz(input)).toBe(`
            class Test {
                passed: boolean;
            }
            new Test().passed = true;
        `);
    });

    it('should detect types for private class fields', () => {
        const input = `
            class Test {
                private passed;
                constructor() {
                    this.passed = true;
                }
            }
            new Test();
        `;

        expect(typeWiz(input)).toBe(`
            class Test {
                private passed: boolean;
                constructor() {
                    this.passed = true;
                }
            }
            new Test();
        `);
    });

    it('should detect types for optional class fields, and not add undefined as a type option', () => {
        const input = `
            class Foo {
                someValue?;
            }
            const foo = new Foo();
            foo.someValue = 5;
            foo.someValue = '';
            foo.someValue = undefined;
        `;

        expect(typeWiz(input)).toBe(`
            class Foo {
                someValue?: number|string;
            }
            const foo = new Foo();
            foo.someValue = 5;
            foo.someValue = '';
            foo.someValue = undefined;
        `);
    });

    it('should detect types for readonly class fields', () => {
        const input = `
            class Foo {
                readonly someValue;
                constructor() {
                    this.someValue = 15;
                }
            }
            const foo = new Foo();
        `;

        expect(typeWiz(input, true)).toBe(`
            class Foo {
                readonly someValue: number;
                constructor() {
                    this.someValue = 15;
                }
            }
            const foo = new Foo();
        `);
    });
});

describe('apply-types options', () => {
    describe('prefix', () => {
        it('should add the given prefix in front of the detected types', () => {
            const input = `
                function greet(c) {
                    return 'Hello ' + c;
                }
                greet('World');
            `;

            expect(typeWiz(input, false, { prefix: '/*auto*/' })).toBe(`
                function greet(c: /*auto*/string) {
                    return 'Hello ' + c;
                }
                greet('World');
            `);
        });
    });
});
