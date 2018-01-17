import { $_$twiz } from './type-collector-snippet';

describe('type-collector', () => {
    describe('getTypeName', () => {
        it('should should return "null" for null', () => {
            expect($_$twiz.typeName(null)).toBe('null');
        });

        it('should should return "undefined" for undefined', () => {
            expect($_$twiz.typeName(undefined)).toBe('undefined');
        });

        it('should should return "boolean" for a true', () => {
            expect($_$twiz.typeName(true)).toBe('boolean');
        });

        it('should should return "number" for a NaN', () => {
            // Not-a-Number is a actually number. I know, this is funny.
            expect($_$twiz.typeName(NaN)).toBe('number');
        });

        it('should should return "string" for a string', () => {
            expect($_$twiz.typeName('hello')).toBe('string');
        });

        it('should should return "Set" for a Set', () => {
            expect($_$twiz.typeName(new Set())).toBe('Set');
        });

        it('should should return null for an empty array', () => {
            expect($_$twiz.typeName([])).toBe(null);
        });

        it('should should return "string[]" for array of strings', () => {
            expect($_$twiz.typeName(['foo', 'bar'])).toBe('string[]');
        });

        it('should should return "Array<number|string>" for mixed array of strings and numbers', () => {
            expect($_$twiz.typeName(['foo', 15])).toBe('Array<number|string>');
        });

        it('should should return "string[][]" for array of string arrays', () => {
            expect($_$twiz.typeName([['foo'], [], ['bar', 'baz']])).toBe('string[][]');
        });

        it('should return "object" for Objects', () => {
            expect($_$twiz.typeName({})).toBe('object');
        });

        it('should return "Function" for functions', () => {
            expect($_$twiz.typeName(() => 0)).toBe('Function');
        });

        it('should throw a NestError in case of array has includes itself', () => {
            const a = [];
            a.push(a);
            expect(() => $_$twiz.typeName(a)).toThrowError('NestError');
        });
    });
});
