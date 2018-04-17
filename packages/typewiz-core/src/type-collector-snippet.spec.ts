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

        it('should throw a NestError in case of array has includes itself', () => {
            const a: any[] = [];
            a.push(a);
            expect(() => $_$twiz.typeName(a)).toThrowError('NestError');
        });

        it('should throw a NestError if invoked while already running (e.g. from an object getter)', () => {
            const obj = {
                get recurse() {
                    return $_$twiz.typeName(obj);
                },
            };
            expect(() => $_$twiz.typeName(obj)).toThrow('Called getTypeName() while it was already running');
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

        describe('objects', () => {
            it('should output nice empty object for empty objects', () => {
                expect($_$twiz.typeName({})).toBe('{}');
            });
            it("should infer simple one-level objects' types", () => {
                expect($_$twiz.typeName({ foo: 'hello', bar: 42, baz: true })).toBe(
                    '{ bar: number, baz: boolean, foo: string }',
                );
            });
            it('should return the same result for differently sorted keys', () => {
                const input1 = { a: 'hello', b: 'world' };
                const input2 = { b: 'hello', a: 'world' };

                expect($_$twiz.typeName(input1)).toBe($_$twiz.typeName(input2));
            });
            it('should infer nested simple objects', () => {
                expect($_$twiz.typeName({ foo: { bar: { baz: 'hello' } } })).toBe('{ foo: { bar: { baz: string } } }');
            });
            it('should work with functions', () => {
                expect(
                    $_$twiz.typeName({
                        foo: () => 42,
                        bar(param: boolean) {
                            return 'hello';
                        },
                    }),
                ).toBe('{ bar: (param: any) => any, foo: () => any }'); // Can't infer function types yet :(
            });
            it('should work with array values', () => {
                expect($_$twiz.typeName({ foo: ['hello', 'world'], bar: ['hello', 42] })).toBe(
                    '{ bar: Array<number|string>, foo: string[] }',
                );
            });
            it('should work with special characters in property names', () => {
                expect($_$twiz.typeName({ 'foo-bar': 42 })).toBe('{ "foo-bar": number }');
            });
            it('should throw on circular references', () => {
                const x = {} as any;
                x.foo = x;

                expect(() => $_$twiz.typeName(x)).toThrowError('NestError');
            });
        });
    });
});
