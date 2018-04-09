import * as Ajv from 'ajv';
import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';
import * as util from 'util';
import { IApplyTypesOptions } from './apply-types';
import { ICompilerOptions } from './compiler-helper';
import { IInstrumentOptions } from './instrument';
const readFileAsync = util.promisify(fs.readFile);
const typewizConfigSchema = require('./typewiz.json'); // tslint:disable-line:no-var-requires

export class ConfigurationParser {
    private typewizConfig: any;
    private configurationPath: string | undefined;

    public findConfigFile(cwd: string): string {
        return ts.findConfigFile(cwd, ts.sys.fileExists, 'typewiz.json');
    }

    public async parse(configurationPath: string): Promise<void> {
        let typewizConfigString;
        try {
            typewizConfigString = await readFileAsync(path.resolve(configurationPath), { encoding: 'utf8' });
            this.configurationPath = path.resolve(configurationPath);
        } catch (error) {
            typewizConfigString = '{}';
        }

        this.parseConfig(typewizConfigString);
    }

    public parseSync(configurationPath: string): void {
        let typewizConfigString;
        try {
            typewizConfigString = fs.readFileSync(path.resolve(configurationPath), { encoding: 'utf8' });
            this.configurationPath = path.resolve(configurationPath);
        } catch (error) {
            typewizConfigString = '{}';
        }

        this.parseConfig(typewizConfigString);
    }

    public getCompilerOptions(): ICompilerOptions {
        const compilerOptions: ICompilerOptions = { ...this.typewizConfig.common };
        if (compilerOptions.rootDir && this.configurationPath) {
            compilerOptions.rootDir = path.resolve(path.dirname(this.configurationPath), compilerOptions.rootDir);
        }
        if (compilerOptions.tsConfig && this.configurationPath) {
            compilerOptions.tsConfig = path.resolve(path.dirname(this.configurationPath), compilerOptions.tsConfig);
        }
        return compilerOptions;
    }

    public getInstrumentOptions(): IInstrumentOptions {
        return { ...this.getCompilerOptions(), ...this.typewizConfig.instrument };
    }

    public getApplyTypesOptions(): IApplyTypesOptions {
        return { ...this.getCompilerOptions(), ...this.typewizConfig.applyTypes };
    }

    private parseConfig(typewizConfigString: string): void {
        let typewizConfig;
        try {
            typewizConfig = JSON.parse(typewizConfigString);
        } catch (error) {
            throw new Error('Could not parser configuration file: ' + error.message);
        }

        const ajv = new Ajv();
        const valid = ajv.validate(typewizConfigSchema, typewizConfig);
        if (!valid) {
            throw new Error(ajv.errorsText(ajv.errors, { dataVar: 'typewiz.json' }));
        }
        this.typewizConfig = typewizConfig;
    }
}
