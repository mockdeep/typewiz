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
            totalTypes: 2,
        });
    });
});
