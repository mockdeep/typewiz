import * as fs from 'fs';
import * as path from 'path';

import { applyReplacements, Replacement } from './replacement';

export type ICollectedTypeInfo = Array<[string, number, string[]]>;

export function applyTypesToFile(source: string, typeInfo: ICollectedTypeInfo) {
    const replacements = [];
    for (const [, pos, types] of typeInfo) {
        const isOptional = source[pos - 1] === '?';
        let sortedTypes = types.sort();
        if (isOptional) {
            sortedTypes = sortedTypes.filter((t) => t !== 'undefined');
            if (sortedTypes.length === 0) {
                continue;
            }
        }
        replacements.push(Replacement.insert(pos, ': ' + sortedTypes.join('|')));
    }
    return applyReplacements(source, replacements);
}

export function applyTypes(typeInfo: Array<[string, number, string[]]>, rootDir?: string) {
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
