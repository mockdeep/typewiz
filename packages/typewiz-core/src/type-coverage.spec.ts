import { getProgram } from './compiler-helper';
import { virtualCompilerHost, virtualTsConfigHost } from './test-utils/transpile';
import { typeCoverage } from './type-coverage';

describe('type-coverage', () => {
    it('should return the current type coverage', () => {
        const input = `
            var f;
            var g: number;
        `;

        const program = getProgram({
            tsCompilerHost: virtualCompilerHost(input, 'c:/test.ts'),
            tsConfig: 'tsconfig.json',
            tsConfigHost: virtualTsConfigHost({
                compilerOptions: {
                    noImplicitThis: true,
                    target: 'es2015',
                },
                include: ['test.ts'],
            }),
        });
        expect(typeCoverage(program)).toEqual({
            knownTypes: 1,
            percentage: 50,
            totalTypes: 2,
        });
    });

    it('should not count function declarations when calculating the type coverage', () => {
        const input = `
            function f() {}
        `;

        const program = getProgram({
            tsCompilerHost: virtualCompilerHost(input, 'c:/test.ts'),
            tsConfig: 'tsconfig.json',
            tsConfigHost: virtualTsConfigHost({
                compilerOptions: {
                    noImplicitThis: true,
                    target: 'es2015',
                },
                include: ['test.ts'],
            }),
        });
        expect(typeCoverage(program)).toEqual({
            knownTypes: 0,
            percentage: 100,
            totalTypes: 0,
        });
    });

    it('should not count class declarations when calculating the type coverage', () => {
        const input = `
            class MyClass {
                constructor () {}
            }
        `;

        const program = getProgram({
            tsCompilerHost: virtualCompilerHost(input, 'c:/test.ts'),
            tsConfig: 'tsconfig.json',
            tsConfigHost: virtualTsConfigHost({
                compilerOptions: {
                    noImplicitThis: true,
                    target: 'es2015',
                },
                include: ['test.ts'],
            }),
        });
        expect(typeCoverage(program)).toEqual({
            knownTypes: 0,
            percentage: 100,
            totalTypes: 0,
        });
    });
});
