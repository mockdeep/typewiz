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
        it('should throw a NestError in case of array has includes itself', () => {
            const a: any[] = [];
            a.push(a);
            expect(() => $_$twiz.typeName(a)).toThrowError('NestError');
        });

        describe('functions', () => {
            /* tslint:disable:only-arrow-functions*/
            it('should return "() => any" for functions without arguments', () => {
                const expected = '() => any';

                /* tslint:disable-next-line*/
                expect($_$twiz.typeName(() => 0)).toBe(expected);
                expect(
                    $_$twiz.typeName(function() {
                        return 0;
                    }),
                ).toBe(expected);
            });

            it('should return "(a: any, b: any) => any" for functions with arguments', () => {
                const expected = '(a: any,b: any) => any';

                expect($_$twiz.typeName((a: any, b: any) => a + b)).toBe(expected);
                expect(
                    $_$twiz.typeName(function(a: any, b: any) {
                        return a * b;
                    }),
                ).toBe(expected);
            });

            it('should return "(a: any, b: any) => any" for functions with default value', () => {
                const expected = '(a: any,b: any) => any';

                expect($_$twiz.typeName((a = 2, b = 3) => a + b)).toBe(expected);
                expect(
                    $_$twiz.typeName(function(a = '2', b = 3) {
                        return a + b;
                    }),
                ).toBe(expected);
            });

            it('should return "(a: any) => any" for functions with array destructor', () => {
                const expected = '(aArray: any) => any';

                expect($_$twiz.typeName(([a]: number[]) => a)).toBe(expected);
                expect(
                    $_$twiz.typeName(function([a]: number[]) {
                        return a;
                    }),
                ).toBe(expected);
            });

            it('should return "(aObject: {a: any}) => any" for functions with object destructor', () => {
                expect($_$twiz.typeName(({ a }: { a: number }) => a)).toBe('(aObject: {a: any}) => any');
                expect(
                    $_$twiz.typeName(function({ a }: { a: number }) {
                        return a;
                    }),
                ).toBe('(aObject: {a: any}) => any');
            });

            it('should return "(a: any[]) => any" for functions with rest operator', () => {
                const expected = '(...aArray: any[]) => any';

                expect($_$twiz.typeName((...a: number[]) => a)).toBe(expected);
                expect(
                    $_$twiz.typeName(function(...a: number[]) {
                        return a;
                    }),
                ).toBe(expected);
            });

            it('should work for a complex function', () => {
                const multByNumberHOC = (multiplier: number) => (num: number) => num * multiplier;
                expect($_$twiz.typeName(multByNumberHOC)).toBe('(multiplier: any) => any');

                const multBy2 = multByNumberHOC(2);
                expect($_$twiz.typeName(multBy2)).toBe('(num: any) => any');

                function stringify(json: {}, stringifyFunc = JSON.stringify, replacer = null, space = ' ') {
                    return stringifyFunc(json, replacer, space);
                }

                expect($_$twiz.typeName(stringify)).toBe(
                    '(json: any,stringifyFunc: any,replacer: any,space: any) => any',
                );
            });

            /* tslint:enable:only-arrow-functions*/
        });
    });
});
