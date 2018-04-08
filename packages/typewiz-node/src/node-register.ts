import { ConfigurationParser, instrument } from 'typewiz-core';
import { $_$twiz } from 'typewiz-core/dist/type-collector-snippet';

type ICompileFunction = (source: string, filename: string) => void;

export interface IRegisterOptions {
    typewizConfig: string;
    extensions?: string[];
}

export async function register(options: IRegisterOptions) {
    options = Object.assign(
        {
            extensions: ['.ts', '.tsx'],
            typewizConfig: 'typewiz.json',
        },
        options,
    );

    const configurationParser = new ConfigurationParser();
    await configurationParser.parse(options.typewizConfig);

    (global as any).$_$twiz = $_$twiz;

    const oldHooks: { [key: string]: any } = {};
    for (const extension of options.extensions!) {
        const oldHook = require.extensions[extension] || require.extensions['.js'];
        oldHooks[extension] = oldHook;
        require.extensions[extension] = (m: NodeModule & { _compile: ICompileFunction }, file) => {
            const oldCompile = m._compile;
            m._compile = (source: string, filename: string) => {
                m._compile = oldCompile;
                m._compile(instrument(source, filename, configurationParser.getInstrumentOptions()), filename);
            };
            oldHook(m, file);
        };
    }

    return function unregister() {
        for (const extension of Object.keys(oldHooks)) {
            require.extensions[extension] = oldHooks[extension];
        }
    };
}
