import * as ts from 'typescript';
import { transformSourceCode } from './transformer';

function astPrettyPrint(sourceText: string) {
    const printer: ts.Printer = ts.createPrinter();
    return printer.printFile(ts.createSourceFile('test.ts', sourceText, ts.ScriptTarget.Latest));
}

describe('transformer', () => {
    it('should instrument function parameters without types', () => {
        const input = `function (a) { return 5; }`;
        expect(transformSourceCode(input, 'test.ts')).toContain(
            astPrettyPrint(`function (a) { $_$twiz("a", a, 11, "test.ts", {}); return 5; }`),
        );
    });

    it('should instrument function with two parameters', () => {
        const input = `function (a, b) { return 5; }`;
        expect(transformSourceCode(input, 'test.ts')).toContain(
            astPrettyPrint(`$_$twiz("b", b, 14, "test.ts", {});`).trim(),
        );
    });

    it('should instrument class method parameters', () => {
        const input = `class Foo { bar(a) { return 5; } }`;
        expect(transformSourceCode(input, 'test.ts')).toContain(
            astPrettyPrint(`class Foo { bar(a) { $_$twiz("a", a, 17, "test.ts", {}); return 5; } }`),
        );
    });

    it('should add typewiz declarations', () => {
        const input = `function (a) { return 5; }`;
        expect(transformSourceCode(input, 'test.ts')).toContain(
            astPrettyPrint(
                `declare function $_$twiz(name: string, value: any, pos: number, filename: string, opts: any): void`,
            ),
        );
    });
});
