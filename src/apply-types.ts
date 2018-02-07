import * as fs from 'fs';
import * as path from 'path';

import { IExtraOptions } from './instrument';
import { applyReplacements, Replacement } from './replacement';

export type ICollectedTypeInfo = Array<[string, number, string[], IExtraOptions]>;

export interface IApplyTypesOptions {
    /**
     * A prefix that will be added in front of each type applied. You can use a javascript comment
     * to mark the automatically added types. The prefix will be added after the colon character,
     * just before the actual type.
     */
    prefix?: string;

    /**
     * If given, all the file paths in the collected type info will be resolved relative to this directory.
     */
    rootDir?: string;
}

export function applyTypesToFile(source: string, typeInfo: ICollectedTypeInfo, options: IApplyTypesOptions) {
    const replacements = [];
    const prefix = options.prefix || '';
    for (const [, pos, types, opts] of typeInfo) {
        const isOptional = source[pos - 1] === '?';
        let sortedTypes = types.sort();
        if (isOptional) {
            sortedTypes = sortedTypes.filter((t) => t !== 'undefined');
            if (sortedTypes.length === 0) {
                continue;
            }
        }
        let suffix = '';
        if (opts && opts.parens) {
            replacements.push(Replacement.insert(opts.parens[0], '('));
            suffix = ')';
        }
        replacements.push(Replacement.insert(pos, ': ' + prefix + sortedTypes.join('|') + suffix));
    }
    return applyReplacements(source, replacements);
}

export function applyTypes(typeInfo: ICollectedTypeInfo, options: IApplyTypesOptions = {}) {
    const files: {[key: string]: typeof typeInfo} = {};
    for (const entry of typeInfo) {
        const file = entry[0];
        if (!files[file]) {
            files[file] = [];
        }
        files[file].push(entry);
    }
    for (const file of Object.keys(files)) {
        const filePath = options.rootDir ? path.join(options.rootDir, file) : file;
        const source = fs.readFileSync(filePath, 'utf-8');
        fs.writeFileSync(filePath, applyTypesToFile(source, files[file], options));
    }
}
