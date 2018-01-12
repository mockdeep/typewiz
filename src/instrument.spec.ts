import { instrument } from './instrument';

describe('instrument', () => {
    it('should instrument function parameters without types', () => {
        const input = `function (a) { return 5; }`;
        expect(instrument(input, 'test.ts')).toEqual(`function (a) {$at("a",a,11,"test.ts"); return 5; }`);
    });

    it('should instrument class method parameters', () => {
        const input = `class Foo { bar(a) { return 5; } }`;
        expect(instrument(input, 'test.ts')).toEqual(`class Foo { bar(a) {$at("a",a,17,"test.ts"); return 5; } }`);
    });

    it('should not instrument function parameters that already have a type', () => {
        const input = `function (a: string) { return 5; }`;
        expect(instrument(input, 'test.ts')).toEqual(`function (a: string) { return 5; }`);
    });

    it('should not instrument function parameters that have a default value', () => {
        const input = `function (a = 12) { return a; }`;
        expect(instrument(input, 'test.ts')).toEqual(`function (a = 12) { return a; }`);
    });
});
