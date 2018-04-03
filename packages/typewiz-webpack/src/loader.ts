import { getOptions } from 'loader-utils';
import * as path from 'path';
import { ConfigurationParser, instrument } from 'typewiz-core';
import { loader } from 'webpack';

let promise: Promise<void>;
let configurationParser: ConfigurationParser;

export async function typewizLoader(this: loader.LoaderContext, source: string | undefined) {
    const callback = this.async();

    const typewizConfigPath = path.resolve(getOptions(this).typewizConfig || 'typewiz.json');
    this.addDependency(typewizConfigPath);

    if (promise) {
        await promise;
    }
    if (!configurationParser) {
        configurationParser = new ConfigurationParser();
        promise = configurationParser.parse(typewizConfigPath);
        await promise;
    }

    const filename = this.resourcePath;
    if (source && (filename.endsWith('.ts') || filename.endsWith('.tsx'))) {
        callback!(null, instrument(source, filename, configurationParser.getInstrumentOptions()));
    } else {
        callback!(null, source);
    }
}
