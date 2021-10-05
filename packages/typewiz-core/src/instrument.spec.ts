import * as ts from 'typescript';
import { instrument } from './instrument';

function astPrettyPrint(sourceText: string) {
    const printer: ts.Printer = ts.createPrinter();
    return printer.printFile(ts.createSourceFile('test.ts', sourceText, ts.ScriptTarget.Latest));
}

describe('instrument', () => {
    it('should instrument function parameters without types', () => {
        const input = `function (a) { return 5; }`;
        expect(instrument(input, 'test.ts')).toContain(
            astPrettyPrint(
                `function (a) { $_$twiz(a, 11, "test.ts", "{}", "72f01d0740f3f0ac5bd0f708b639b578"); return 5; }`,
            ),
        );
    });

    it('should instrument function with two parameters', () => {
        const input = `function (a, b) { return 5; }`;
        expect(instrument(input, 'test.ts')).toContain(
            astPrettyPrint(`$_$twiz(b, 14, "test.ts", "{}", "e1579a22f084265f8fb450beba126b53");`).trim(),
        );
    });

    it('should instrument class method parameters', () => {
        const input = `class Foo { bar(a) { return 5; } }`;
        expect(instrument(input, 'test.ts')).toContain(
            astPrettyPrint(
                // tslint:disable-next-line:max-line-length
                `class Foo { bar(a) { $_$twiz(a, 17, "test.ts", "{}", "d8797d533a93b14ff250fc6b33511db2"); return 5; } }`,
            ),
        );
    });

    it('should not instrument function parameters that already have a type', () => {
        const input = `function (a: string) { return 5; }`;
        expect(instrument(input, 'test.ts')).toMatch(`function (a: string) { return 5; }`);
    });

    it('should not instrument function parameters that have a default value', () => {
        const input = `function (a = 12) { return a; }`;
        expect(instrument(input, 'test.ts')).toMatch(`function (a = 12) { return a; }`);
    });

    it('should add typewiz declarations', () => {
        const input = `function (a) { return 5; }`;
        expect(instrument(input, 'test.ts')).toContain(
            astPrettyPrint(
                `declare function $_$twiz(value: any, pos: number, filename: string, opts: any, hash: string): void`,
            ),
        );
    });

    it('should not instrument a function declaration that has no a body', () => {
        // See issue #85 for details
        const input = `function foo(n: number): void;`;
        expect(instrument(input, 'test.ts')).toContain(astPrettyPrint('function foo(n: number): void;'));
    });

    describe('instrumentCallExpressions', () => {
        it('should instrument function calls', () => {
            const input = `foo(bar)`;
            expect(
                instrument(input, 'test.ts', {
                    instrumentCallExpressions: true,
                    skipTwizDeclarations: true,
                }),
            ).toMatch(`foo($_$twiz.track(bar, "test.ts", 4, "82792dee0fbe844bbbea67736c26447d"))`);
        });

        it('should not instrument numeric arguments in function calls', () => {
            const input = `foo(5)`;
            expect(
                instrument(input, 'test.ts', {
                    instrumentCallExpressions: true,
                    skipTwizDeclarations: true,
                }),
            ).toMatch(`foo(5)`);
        });

        it('should not instrument string arguments in function calls', () => {
            const input = `foo('bar')`;
            expect(
                instrument(input, 'test.ts', {
                    instrumentCallExpressions: true,
                    skipTwizDeclarations: true,
                }),
            ).toMatch(`foo('bar')`);
        });

        it('should not instrument a spread argument in function call', () => {
            const input = `foo(...bar)`;
            expect(
                instrument(input, 'test.ts', {
                    instrumentCallExpressions: true,
                    skipTwizDeclarations: true,
                }),
            ).toMatch(`foo(...bar)`);
        });
    });
});
