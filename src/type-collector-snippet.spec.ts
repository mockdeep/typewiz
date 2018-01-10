import { $at } from './type-collector-snippet';

describe('type-collector', () => {
    describe('getTypeName', () => {
        it('should should return "null" for null', () => {
            expect($at.typeName(null)).toBe('null');
        });

        it('should should return "undefined" for undefined', () => {
            expect($at.typeName(undefined)).toBe('undefined');
        });

        it('should should return "boolean" for a true', () => {
            expect($at.typeName(true)).toBe('boolean');
        });

        it('should should return "number" for a NaN', () => {
            // Not-a-Number is a actually number. I know, this is funny.
            expect($at.typeName(NaN)).toBe('number');
        });

        it('should should return "string" for a string', () => {
            expect($at.typeName('hello')).toBe('string');
        });

        it('should should return "Set" for a Set', () => {
            expect($at.typeName(new Set())).toBe('Set');
        });

        it('should should return null for an empty array', () => {
            expect($at.typeName([])).toBe(null);
        });

        it('should should return "string[]" for array of strings', () => {
            expect($at.typeName(['foo', 'bar'])).toBe('string[]');
        });

        it('should should return "Array<number|string>" for mixed array of strings and numbers', () => {
            expect($at.typeName(['foo', 15])).toBe('Array<number|string>');
        });

        it('should should return "string[][]" for array of string arrays', () => {
            expect($at.typeName([['foo'], [], ['bar', 'baz']])).toBe('string[][]');
        });

        it('should return "Function" for functions', () => {
            expect($at.typeName(() => 0)).toBe('Function');
        });

        it('should throw a NestError in case of array has includes itself', () => {
            const a = [];
            a.push(a);
            expect(() => $at.typeName(a)).toThrowError('NestError');
        });
    });
});
