import * as fs from 'fs';
import * as path from 'path';

import { IExtraOptions } from './instrument';
import { applyReplacements, Replacement } from './replacement';

export type ICollectedTypeInfo = Array<[string, number, string[], IExtraOptions]>;

export function applyTypesToFile(source: string, typeInfo: ICollectedTypeInfo) {
    const replacements = [];
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
        replacements.push(Replacement.insert(pos, ': ' + sortedTypes.join('|') + suffix));
    }
    return applyReplacements(source, replacements);
}

export function applyTypes(typeInfo: ICollectedTypeInfo, rootDir?: string) {
    const files: {[key: string]: typeof typeInfo} = {};
    for (const entry of typeInfo) {
        const file = entry[0];
        if (!files[file]) {
            files[file] = [];
        }
        files[file].push(entry);
    }
    for (const file of Object.keys(files)) {
        const filePath = rootDir ? path.join(rootDir, file) : file;
        const source = fs.readFileSync(filePath, 'utf-8');
        fs.writeFileSync(filePath, applyTypesToFile(source, files[file]));
    }
}
