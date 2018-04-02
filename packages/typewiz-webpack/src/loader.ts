import { getOptions } from 'loader-utils';
import * as path from 'path';
import { ConfigurationParser, instrument } from 'typewiz-core';
import { loader } from 'webpack';

export async function typewizLoader(this: loader.LoaderContext, source: string | undefined) {
    const callback = this.async();

    const typewizConfigPath = path.resolve(getOptions(this).typewizConfig || 'typewiz.json');
    this.addDependency(typewizConfigPath);

    const configurationParser = new ConfigurationParser();
    await configurationParser.parse(typewizConfigPath);

    const filename = this.resourcePath;
    if (source && (filename.endsWith('.ts') || filename.endsWith('.tsx'))) {
        callback!(null, instrument(source, filename, configurationParser.getInstrumentOptions()));
    } else {
        callback!(null, source);
    }
}
