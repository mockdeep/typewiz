import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';
import * as vm from 'vm';

import { applyTypes } from './apply-types';
import { instrument } from './instrument';

describe('integration test', () => {
    it('should correctly infer and set the types', () => {
        const input = `
            function calculate(a, b) {
                return a + b;
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
            function calculate(a: number, b: number) {
                return a + b;
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
        const instrumented = instrument(input, 'test.ts');

        // Step 2: compile + add the type collector
        const opts = {
            module: ts.ModuleKind.None,
        };

        const typeCollector = ts.transpile(fs.readFileSync(path.join(__dirname, '/type-collector.ts'), 'utf-8'), opts);
        const compiled = ts.transpile(instrumented, opts);

        // Step 3: evaluate the code, and collect the runtime type information
        const collectedTypes = vm.runInNewContext('exports = {};\n' + typeCollector + compiled + '$at.get();');

        // Step 4: put the collected typed into the code
        const result = applyTypes(input, collectedTypes);

        expect(result).toEqual(expected);
    });
});
