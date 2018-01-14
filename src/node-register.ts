import { instrument } from './index';
import { $at } from './type-collector-snippet';

type ICompileFunction = (source: string, filename: string) => void;

export interface IRegisterOptions {
    extensions: string[];
}

export function register(options?: IRegisterOptions) {
    options = Object.assign({
        extensions: ['.ts', '.tsx'],
    }, options);

    (global as any).$at = $at;

    const oldHooks: {[key: string]: any} = {};
    for (const extension of options.extensions) {
        const oldHook = require.extensions[extension] || require.extensions['.js'];
        oldHooks[extension] = oldHook;
        require.extensions[extension] = (m: NodeModule & { _compile: ICompileFunction }, file) => {
            const oldCompile = m._compile;
            m._compile = (source: string, filename: string) => {
                m._compile = oldCompile;
                m._compile(instrument(source, filename), filename);
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
