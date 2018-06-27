require('util.promisify/shim')(); // tslint:disable-line:no-var-requires
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

export function register(options: IOptions = {}) {
    const configurationParser = new typewiz.ConfigurationParser();
    const typewizConfigPath =
        options && options.typewizConfig
            ? path.resolve(options.typewizConfig)
            : configurationParser.findConfigFile(process.cwd());
    if (typewizConfigPath) {
        configurationParser.parseSync(typewizConfigPath);
    }

    nodeRegister.register({ typewizConfig: typewizConfigPath });
    tsnode.register(options.tsNode);
    if (options.applyOnExit !== false) {
        process.on('exit', () => {
            typewiz.applyTypes(getCollectedTypes(), configurationParser.getApplyTypesOptions());
        });
    }
}
