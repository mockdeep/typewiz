import { instrument } from './instrument';

describe('instrument', () => {
    it('should instrument function parameters without types', () => {
        const input = `function (a) { return 5; }`;
        expect(instrument(input, 'test.ts')).toMatch(`function (a) {$_$twiz("a",a,11,"test.ts"); return 5; }`);
    });

    it('should correctly instrument optional function parameters', () => {
        const input = `function (a?) { return 5; }`;
        expect(instrument(input, 'test.ts')).toMatch(`function (a?) {$_$twiz("a",a,12,"test.ts"); return 5; }`);
    });

    it('should instrument class method parameters', () => {
        const input = `class Foo { bar(a) { return 5; } }`;
        expect(instrument(input, 'test.ts')).toMatch(`class Foo { bar(a) {$_$twiz("a",a,17,"test.ts"); return 5; } }`);
    });

    it('should not instrument function parameters that already have a type', () => {
        const input = `function (a: string) { return 5; }`;
        expect(instrument(input, 'test.ts')).toMatch(`function (a: string) { return 5; }`);
    });

    it('should not instrument function parameters that have a default value', () => {
        const input = `function (a = 12) { return a; }`;
        expect(instrument(input, 'test.ts')).toMatch(`function (a = 12) { return a; }`);
    });
});
