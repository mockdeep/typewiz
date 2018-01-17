import * as tsnode from 'ts-node';
import * as typewiz from 'typewiz';
import { $_$twiz } from 'typewiz/dist/type-collector-snippet';

export interface IOptions {
    applyOnExit?: boolean;
    tsNode?: tsnode.Options;
}

export function getCollectedTypes() {
    return $_$twiz.get();
}

export function register(options: IOptions = {}) {
    typewiz.register();
    tsnode.register(options.tsNode);
    if (options.applyOnExit !== false) {
        process.on('exit', () => typewiz.applyTypes(getCollectedTypes()));
    }
}
