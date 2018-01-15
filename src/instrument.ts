import * as ts from 'typescript';

import { applyReplacements, Replacement } from './replacement';

function visit(node: ts.Node, replacements: Replacement[], fileName: string) {
    if ((ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node))) {
        for (const param of node.parameters) {
            if (!param.type && !param.initializer && node.body) {
                const typeInsertionPos = param.name.getEnd() + (param.questionToken ? 1 : 0);
                const params = [
                    JSON.stringify(param.name.getText()),
                    param.name.getText(),
                    typeInsertionPos,
                    JSON.stringify(fileName),
                ];
                const instrumentExpr = `$_$twiz(${params.join(',')});`;
                replacements.push(Replacement.insert(node.body.getStart() + 1, instrumentExpr));
            }
        }
    }
    node.forEachChild((child) => visit(child, replacements, fileName));
}

const declaration = `declare function $_$twiz(name: string, value: any, pos: number, filename: string): void;\n`;

export function instrument(source: string, fileName: string) {
    const sourceFile = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true);
    const replacements = [] as Replacement[];
    visit(sourceFile, replacements, fileName);
    if (replacements.length) {
        replacements.push(Replacement.insert(0, declaration));
    }
    return applyReplacements(source, replacements);
}
