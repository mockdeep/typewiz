import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';

import { getProgram, ICompilerOptions } from './compiler-helper';
import { applyReplacements, Replacement } from './replacement';
import { ICollectedTypeInfo, ISourceLocation } from './type-collector-snippet';

export interface IApplyTypesOptions extends ICompilerOptions {
    /**
     * A prefix that will be added in front of each type applied. You can use a javascript comment
     * to mark the automatically added types. The prefix will be added after the colon character,
     * just before the actual type.
     */
    prefix?: string;
}

function findType(program?: ts.Program, typeName?: string, sourcePos?: ISourceLocation) {
    if (program && sourcePos) {
        const [sourceName, sourceOffset] = sourcePos;
        const typeChecker = program.getTypeChecker();
        let foundType: string | null = null;
        function visit(node: ts.Node) {
            if (node.getStart() === sourceOffset) {
                const type = typeChecker.getTypeAtLocation(node);
                foundType = typeChecker.typeToString(type);
            }
            ts.forEachChild(node, visit);
        }
        const sourceFile = program.getSourceFile(sourceName);
        visit(sourceFile);
        if (foundType && foundType !== 'any') {
            return foundType;
        }
    }
    return typeName;
}

export function applyTypesToFile(
    source: string,
    typeInfo: ICollectedTypeInfo,
    options: IApplyTypesOptions,
    program?: ts.Program,
) {
    const replacements = [];
    const prefix = options.prefix || '';
    for (const [, pos, types, opts] of typeInfo) {
        const isOptional = source[pos - 1] === '?';
        let sortedTypes = types
            .map(([name, sourcePos]) => findType(program, name, sourcePos))
            .filter((t) => t)
            .sort();
        if (isOptional) {
            sortedTypes = sortedTypes.filter((t) => t !== 'undefined');
        }
        if (sortedTypes.length === 0) {
            continue;
        }

        let thisPrefix = '';
        let suffix = '';
        if (opts && opts.parens) {
            replacements.push(Replacement.insert(opts.parens[0], '('));
            suffix = ')';
        }
        if (opts && opts.comma) {
            suffix = ', ';
        }
        if (opts && opts.thisType) {
            thisPrefix = 'this';
        }
        replacements.push(Replacement.insert(pos, thisPrefix + ': ' + prefix + sortedTypes.join('|') + suffix));
    }
    return applyReplacements(source, replacements);
}

export function applyTypes(typeInfo: ICollectedTypeInfo, options: IApplyTypesOptions = {}) {
    const files: { [key: string]: typeof typeInfo } = {};
    const program: ts.Program | undefined = getProgram(options);
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
        fs.writeFileSync(filePath, applyTypesToFile(source, files[file], options, program));
    }
}
