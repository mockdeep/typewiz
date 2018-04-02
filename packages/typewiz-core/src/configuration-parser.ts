import * as Ajv from 'ajv';
import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';
import { IApplyTypesOptions } from './apply-types';
import { ICompilerOptions } from './compiler-helper';
import { IInstrumentOptions } from './instrument';
const readFileAsync = util.promisify(fs.readFile);

export class ConfigurationParser {
    private typewizConfig: any;

    public async parse(configurationPath: string): Promise<void> {
        const typewizConfigSchema = JSON.parse(await readFileAsync('src/typewiz.json', { encoding: 'utf8' }));

        let typewizConfigString;
        try {
            typewizConfigString = await readFileAsync(path.resolve(configurationPath), { encoding: 'utf8' });
        } catch (error) {
            typewizConfigString = '{}';
        }

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

    public getCompilerOptions(): ICompilerOptions {
        return { ...this.typewizConfig.common };
    }

    public getInstrumentOptions(): IInstrumentOptions {
        return { ...this.getCompilerOptions(), ...this.typewizConfig.instrument };
    }

    public getApplyTypesOptions(): IApplyTypesOptions {
        return { ...this.getCompilerOptions(), ...this.typewizConfig.applyTypes };
    }
}
