import * as path from 'path';
import * as tsnode from 'ts-node';
import * as typewiz from 'typewiz-core';
import { $_$twiz } from 'typewiz-core/dist/type-collector-snippet';
import * as nodeRegister from './node-register';

export interface IOptions {
    typewizConfig?: string;
    applyOnExit?: boolean;
    tsNode?: tsnode.Options;
}

export function getCollectedTypes() {
    return $_$twiz.get();
}

export async function register(options: IOptions = {}) {
    const typewizConfigPath = path.resolve(options && options.typewizConfig ? options.typewizConfig : 'typewiz.json');

    const configurationParser = new typewiz.ConfigurationParser();
    await configurationParser.parse(typewizConfigPath);

    await nodeRegister.register();
    tsnode.register(options.tsNode);
    if (options.applyOnExit !== false) {
        process.on('exit', () => {
            typewiz.applyTypes(getCollectedTypes(), configurationParser.getApplyTypesOptions());
        });
    }
}
