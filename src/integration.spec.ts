import * as fs from 'fs';
import * as ts from 'typescript';
import * as vm from 'vm';

const mockFs = {
    readFileSync: jest.fn(fs.readFileSync),
    writeFileSync: jest.fn(fs.writeFileSync),
};
jest.doMock('fs', () => mockFs);

import { applyTypes, getTypeCollectorSnippet, instrument } from './index';

describe('integration test', () => {
    it('should correctly infer and set the types', () => {
        const input = `
            function calculate(a, b?) {
                return a + (b || 0);
            }

            function greet(c) {
                return 'Hello ' + c;
            }

            function commas(item) {
                return Array.from(item).join(', ');
            }

            function unused(foo, bar) {
            }

            calculate(5, 6);
            greet('World');
            commas('Lavender');
            commas(['Apples', 'Oranges']);
        `;

        const expected = `
            function calculate(a: number, b?: number) {
                return a + (b || 0);
            }

            function greet(c: string) {
                return 'Hello ' + c;
            }

            function commas(item: string|string[]) {
                return Array.from(item).join(', ');
            }

            function unused(foo, bar) {
            }

            calculate(5, 6);
            greet('World');
            commas('Lavender');
            commas(['Apples', 'Oranges']);
        `;

        // Step 1: instrument the source
        const instrumented = instrument(input, 'c:\\test.ts');

        // Step 2: compile + add the type collector
        const compiled = ts.transpile(instrumented);

        // Step 3: evaluate the code, and collect the runtime type information
        const collectedTypes = vm.runInNewContext(getTypeCollectorSnippet() + compiled + '$at.get();');

        // Step 4: put the collected typed into the code
        mockFs.readFileSync.mockReturnValue(input);
        mockFs.writeFileSync.mockImplementationOnce(() => 0);

        const result = applyTypes(collectedTypes);

        // Verify that we got the expected result
        expect(mockFs.writeFileSync).toHaveBeenCalledWith('c:\\test.ts', expected);
    });
});
