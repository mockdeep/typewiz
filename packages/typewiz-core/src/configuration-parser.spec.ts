import * as fs from 'fs';
import * as path from 'path';

let typewizConfig = '';
const mockFs = {
    readFile: jest.fn(
        (filePath: string, options: any, callback: (err: NodeJS.ErrnoException, data: string) => void) => {
            if (
                filePath === path.resolve('packages', 'typewiz-core', 'src', 'typewiz.json') ||
                filePath === path.resolve('not-found-file.json')
            ) {
                fs.readFile(filePath, options, callback);
            } else {
                callback(null, typewizConfig);
            }
        },
    ),
    readFileSync: jest.fn((filePath: string, options: any) => {
        if (
            filePath === path.resolve('packages', 'typewiz-core', 'src', 'typewiz.json') ||
            filePath === path.resolve('not-found-file.json')
        ) {
            return fs.readFileSync(filePath, options);
        } else {
            return typewizConfig;
        }
    }),
};
jest.doMock('fs', () => mockFs);

import { ConfigurationParser } from './configuration-parser';

describe('ConfigurationParser', () => {
    it('should return an empty configuration if parse was not called', () => {
        const configParser = new ConfigurationParser();
        expect(configParser.getCompilerOptions()).toEqual({});
    });

    it('should handle a non-existing typewiz.json file by using an empty default config - async', async () => {
        const configParser = new ConfigurationParser();
        await configParser.parse('not-found-file.json');
    });

    it('should handle a non-existing typewiz.json file by using an empty default config - sync', () => {
        const configParser = new ConfigurationParser();
        configParser.parseSync('not-found-file.json');
    });

    it('should throw an error if given bad typewiz.json file', async () => {
        await expect(
            (() => {
                typewizConfig = '<invalid json>';
                const configParser = new ConfigurationParser();
                return configParser.parse('test/typewiz.json');
            })(),
        ).rejects.toThrow(`Could not parser configuration file: Unexpected token < in JSON at position 0`);
    });

    it('should throw an error if given a typewiz.json file with invalid properties', async () => {
        await expect(
            (() => {
                typewizConfig = `
                    {
                        "commond": {
                            "rootDir": ".",
                            "tsConfig": "./tsconfig.json"
                        }
                    }
                    `;
                const configParser = new ConfigurationParser();
                return configParser.parse('test/typewiz.json');
            })(),
        ).rejects.toThrow(`typewiz.json should NOT have additional properties`);
    });

    it('should parse a valid typewiz.json file with no options set', async () => {
        typewizConfig = `
                    {
                    }
                    `;
        const configParser = new ConfigurationParser();
        await configParser.parse('test/typewiz.json');
    });

    it('should parse a valid typewiz.json file with all options set', async () => {
        typewizConfig = `
                    {
                        "common": {
                            "rootDir": ".",
                            "tsConfig": "./tsconfig.json"
                        },
                        "instrument": {
                            "instrumentCallExpressions": true,
                            "instrumentImplicitThis": true,
                            "skipTwizDeclarations": true
                        },
                        "applyTypes": {
                            "prefix": "TypeWiz |"
                        }
                    }
                    `;
        const configParser = new ConfigurationParser();
        await configParser.parse('test/typewiz.json');
    });

    it('should return an ICompilerConfig if no configuration is specified', async () => {
        await expect(
            (async () => {
                typewizConfig = `
                    {
                    }
                    `;
                const configParser = new ConfigurationParser();
                await configParser.parse('test/typewiz.json');
                return configParser.getCompilerOptions();
            })(),
        ).resolves.toEqual({});
    });

    it('should return an ICompilerConfig if a configuration is specified - async', async () => {
        await expect(
            (async () => {
                typewizConfig = `
                    {
                        "common": {
                            "rootDir": ".",
                            "tsConfig": "./tsconfig.json"
                        }
                    }
                    `;
                const configParser = new ConfigurationParser();
                await configParser.parse('test/typewiz.json');
                return configParser.getCompilerOptions();
            })(),
        ).resolves.toEqual({
            rootDir: path.resolve('test', '.'),
            tsConfig: path.resolve('test', './tsconfig.json'),
        });
    });

    it('should return an ICompilerConfig if a configuration is specified - sync', () => {
        expect(
            (() => {
                typewizConfig = `
                    {
                        "common": {
                            "rootDir": ".",
                            "tsConfig": "./tsconfig.json"
                        }
                    }
                    `;
                const configParser = new ConfigurationParser();
                configParser.parseSync('test/typewiz.json');
                return configParser.getCompilerOptions();
            })(),
        ).toEqual({
            rootDir: path.resolve('test', '.'),
            tsConfig: path.resolve('test', './tsconfig.json'),
        });
    });

    it('should return IInstrumentOptions if no configuration is specified', async () => {
        await expect(
            (async () => {
                typewizConfig = `
                    {
                    }
                    `;
                const configParser = new ConfigurationParser();
                await configParser.parse('test/typewiz.json');
                return configParser.getInstrumentOptions();
            })(),
        ).resolves.toEqual({});
    });

    it('should return IInstrumentOptions if a configuration is specified', async () => {
        await expect(
            (async () => {
                typewizConfig = `
                    {
                        "common": {
                            "rootDir": ".",
                            "tsConfig": "./tsconfig.json"
                        },
                        "instrument": {
                            "instrumentCallExpressions": true,
                            "instrumentImplicitThis": true,
                            "skipTwizDeclarations": true
                        }
                    }
                    `;
                const configParser = new ConfigurationParser();
                await configParser.parse('test/typewiz.json');
                return configParser.getInstrumentOptions();
            })(),
        ).resolves.toEqual({
            instrumentCallExpressions: true,
            instrumentImplicitThis: true,
            rootDir: path.resolve('test', '.'),
            skipTwizDeclarations: true,
            tsConfig: path.resolve('test', './tsconfig.json'),
        });
    });

    it('should return IApplyTypesOptions if no configuration is specified', async () => {
        await expect(
            (async () => {
                typewizConfig = `
                    {
                    }
                    `;
                const configParser = new ConfigurationParser();
                await configParser.parse('test/typewiz.json');
                return configParser.getApplyTypesOptions();
            })(),
        ).resolves.toEqual({});
    });

    it('should return IApplyTypesOptions if a configuration is specified', async () => {
        await expect(
            (async () => {
                typewizConfig = `
                    {
                        "common": {
                            "rootDir": ".",
                            "tsConfig": "./tsconfig.json"
                        },
                        "applyTypes": {
                            "prefix": "TypeWiz |"
                        }
                    }
                    `;
                const configParser = new ConfigurationParser();
                await configParser.parse('test/typewiz.json');
                return configParser.getApplyTypesOptions();
            })(),
        ).resolves.toEqual({
            prefix: 'TypeWiz |',
            rootDir: path.resolve('test', '.'),
            tsConfig: path.resolve('test', './tsconfig.json'),
        });
    });
});
