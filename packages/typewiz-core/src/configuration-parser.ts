import * as Ajv from 'ajv';
import * as fs from 'fs';
import * as path from 'path';

export class ConfigurationParser {
    private typewizConfig: any;

    public parse(configurationPath: string) {
        const typewizConfigSchema = JSON.parse(fs.readFileSync('src/typewiz.json', { encoding: 'utf8' }));

        let typewizConfigString;
        try {
            typewizConfigString = fs.readFileSync(path.resolve(configurationPath), { encoding: 'utf8' });
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
}
