import * as fs from 'fs';
import * as ts from 'typescript';
import * as vm from 'vm';

import { transpileSource } from './test-utils/transpile';

const mockFs = {
    readFileSync: jest.fn(fs.readFileSync),
    writeFileSync: jest.fn(fs.writeFileSync),
};
jest.doMock('fs', () => mockFs);

import { applyTypes, getTypeCollectorSnippet, instrument } from './index';

function typeWiz(input: string) {
    // Step 1: instrument the source
    const instrumented = instrument(input, 'c:\\test.ts');

    // Step 2: compile + add the type collector
    const compiled = transpileSource(instrumented, 'test.ts');

    // Step 3: evaluate the code, and collect the runtime type information
    const collectedTypes = vm.runInNewContext(getTypeCollectorSnippet() + compiled + '$_$twiz.get();');

    // Step 4: put the collected typed into the code
    mockFs.readFileSync.mockReturnValue(input);
    mockFs.writeFileSync.mockImplementationOnce(() => 0);

    applyTypes(collectedTypes);

    if (mockFs.writeFileSync.mock.calls.length) {
        expect(mockFs.writeFileSync).toHaveBeenCalledTimes(1);
        expect(mockFs.writeFileSync).toHaveBeenCalledWith('c:\\test.ts', expect.any(String));
        return mockFs.writeFileSync.mock.calls[0][1];
    } else {
        return null;
    }
}

describe('integration test', () => {
    beforeEach(() => {
        mockFs.readFileSync.mockImplementation(fs.readFileSync);
        jest.clearAllMocks();
    });

    it('should infer `string` type for a simple function', () => {
        const input = `
            function greet(c) {
                return 'Hello ' + c;
            }
            greet('World');
        `;

        expect(typeWiz(input)).toBe(`
            function greet(c: string) {
                return 'Hello ' + c;
            }
            greet('World');
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
});
