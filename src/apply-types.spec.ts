import * as ts from 'typescript';
import { applyTypes } from './apply-types';

describe('applyTypes', () => {
    it('should throw an error if given non-existing tsconfig.json file', () => {
        expect(() => applyTypes([], { tsConfig: 'not-found-file.json' })).toThrowError(
            `Error while reading not-found-file.json: The specified path does not exist: 'not-found-file.json'.`,
        );
    });

    it('should throw an error if given bad tsconfig.json file', () => {
        const tsConfigHost = {
            ...ts.sys,
            readFile: jest.fn(() => '<invalid json>'),
        };
        expect(() => applyTypes([], { tsConfig: 'tsconfig.bad.json', tsConfigHost })).toThrowError(
            `Error while reading tsconfig.bad.json: '{' expected.`,
        );
        expect(tsConfigHost.readFile).toHaveBeenCalledWith('tsconfig.bad.json');
    });

    it('should throw an error in case of validation errors in given tsconfig.json file', () => {
        const tsConfigHost = {
            ...ts.sys,
            readFile: jest.fn(() => '{ "include": 123 }'),
        };
        expect(() => applyTypes([], { tsConfig: 'tsconfig.invalid.json', tsConfigHost })).toThrowError(
            `Error while parsing tsconfig.invalid.json: Compiler option 'include' requires a value of type Array.`,
        );
        expect(tsConfigHost.readFile).toHaveBeenCalledWith('tsconfig.invalid.json');
    });
});
