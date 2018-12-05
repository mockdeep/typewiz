import * as fs from 'fs';
import md5 = require('md5');
import * as path from 'path';
import * as ts from 'typescript';
import { getProgram, ICompilerOptions } from './compiler-helper';
import { applyReplacements, Replacement } from './replacement';
import { ICollectedTypeInfo, IFileTypeInfo, ISourceLocationAndType } from './type-collector-snippet';
import { TypewizError } from './typewiz-error';

export interface IApplyTypesOptions extends ICompilerOptions {
    /**
     * A prefix that will be added in front of each type applied. You can use a javascript comment
     * to mark the automatically added types. The prefix will be added after the colon character,
     * just before the actual type.
     */
    prefix?: string;
}

function findType(program: ts.Program | undefined, typeInfo: string | ISourceLocationAndType) {
    const typeName = typeof typeInfo === 'string' ? typeInfo : typeInfo[2];
    const sourceName = typeof typeInfo !== 'string' ? typeInfo[0] : null;
    const sourceOffset = typeof typeInfo !== 'string' ? typeInfo[1] : null;
    if (program && sourceName) {
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
        if (!sourceFile) {
            throw new TypewizError(`File not found: ${sourceName}`);
        }

        visit(sourceFile);
        if (foundType && foundType !== 'any') {
            return foundType;
        }
    }
    return typeName;
}

export function applyTypesToFile(
    source: string,
    fileTypes: IFileTypeInfo,
    options: IApplyTypesOptions,
    program?: ts.Program,
) {
    const replacements = [];
    const prefix = options.prefix || '';
    let hadChanges = false;
    for (const key of Object.keys(fileTypes)) {
        if (!/^\d+$/.test(key)) {
            continue;
        }
        hadChanges = true;
        const offset = parseInt(key, 10);
        const isOptional = source[offset - 1] === '?';
        const { types, parens, thisNeedsComma, thisType } = fileTypes[offset];
        let sortedTypes = types
            .map((type) => findType(program, type))
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
        if (parens) {
            replacements.push(Replacement.insert(parens[0], '('));
            suffix = ')';
        }
        if (thisNeedsComma) {
            suffix = ', ';
        }
        if (thisType) {
            thisPrefix = 'this';
        }
        replacements.push(Replacement.insert(offset, thisPrefix + ': ' + prefix + sortedTypes.join('|') + suffix));
    }
    return hadChanges ? applyReplacements(source, replacements) : null;
}

export function applyTypes(typeInfo: ICollectedTypeInfo, options: IApplyTypesOptions = {}) {
    const program: ts.Program | undefined = getProgram(options);
    for (const file of Object.keys(typeInfo)) {
        const fileInfo = typeInfo[file];
        const filePath = options.rootDir ? path.join(options.rootDir, file) : file;
        const source = fs.readFileSync(filePath, 'utf-8');
        if (md5(source) !== fileInfo.hash) {
            throw new Error('Hash mismatch! Source file has changed since type information was collected');
        }
        const newContent = applyTypesToFile(source, fileInfo, options, program);
        if (newContent) {
            fs.writeFileSync(filePath, newContent);
        }
    }
}
