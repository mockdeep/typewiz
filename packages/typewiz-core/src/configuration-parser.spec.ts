import * as fs from 'fs';
import * as path from 'path';

let typewizConfig = '';
const mockFs = {
    readFileSync: jest.fn((filePath: string, options?: any) => {
        if (filePath === 'src/typewiz.json' || filePath === path.resolve('not-found-file.json')) {
            return fs.readFileSync(filePath, options);
        } else {
            return typewizConfig;
        }
    }),
};
jest.doMock('fs', () => mockFs);

import { ConfigurationParser } from './configuration-parser';

describe('ConfigurationParser', () => {
    it('should throw an error if given non-existing typewiz.json file', () => {
        expect(() => {
            const configParser = new ConfigurationParser();
            configParser.parse('not-found-file.json');
        }).toThrowError(`Could not find configuration file 'not-found-file.json'`);
    });

    it('should throw an error if given bad typewiz.json file', () => {
        expect(() => {
            typewizConfig = '<invalid json>';
            const configParser = new ConfigurationParser();
            configParser.parse('test/typewiz.json');
        }).toThrowError(`Could not parser configuration file: Unexpected token < in JSON at position 0`);
    });

    it('should throw an error if given a typewiz.json file with invalid properties', () => {
        expect(() => {
            typewizConfig = `
                    {
                        "commond": {
                            "rootDir": "...",
                            "tsConfig": "..."
                        }
                    }
                    `;
            const configParser = new ConfigurationParser();
            configParser.parse('test/typewiz.json');
        }).toThrowError(`typewiz.json should NOT have additional properties`);
    });

    it('should parse a valid typewiz.json file with no options set', () => {
        typewizConfig = `
                    {
                    }
                    `;
        const configParser = new ConfigurationParser();
        configParser.parse('test/typewiz.json');
    });

    it('should parse a valid typewiz.json file with all options set', () => {
        typewizConfig = `
                    {
                        "common": {
                            "rootDir": "...",
                            "tsConfig": "..."
                        },
                        "instrument": {
                            "instrumentCallExpressions": true,
                            "instrumentImplicitThis": true
                        },
                        "applyTypes": {
                            "prefix": "TypeWiz |"
                        }
                    }
                    `;
        const configParser = new ConfigurationParser();
        configParser.parse('test/typewiz.json');
    });
});
