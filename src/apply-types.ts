import { applyReplacements, Replacement } from './replacement';

export type ICollectedTypeInfo = Array<[string, number, string[]]>;

export function applyTypes(source: string, typeInfo: ICollectedTypeInfo) {
    const replacements = [];
    for (const [, pos, types] of typeInfo) {
        replacements.push(Replacement.insert(pos, ': ' + types.sort().join('|')));
    }
    return applyReplacements(source, replacements);
}
