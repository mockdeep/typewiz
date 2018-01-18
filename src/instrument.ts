import * as ts from 'typescript';

import { applyReplacements, Replacement } from './replacement';

export interface IExtraOptions {
    arrow?: boolean;
    parens?: [number, number];
}

function hasParensAroundArguments(node: ts.FunctionLike) {
    if (ts.isArrowFunction(node)) {
        return node.parameters.length !== 1
            || node.getText().substr(0, node.equalsGreaterThanToken.getStart() - node.getStart()).includes('(');
    } else {
        return true;
    }
}

function visit(node: ts.Node, replacements: Replacement[], fileName: string) {
    const isArrow = ts.isArrowFunction(node);
    if (ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node) || ts.isArrowFunction(node)) {
        const isShortArrow = ts.isArrowFunction(node) && !ts.isBlock(node.body);
        for (const param of node.parameters) {
            if (!param.type && !param.initializer && node.body) {
                const typeInsertionPos = param.name.getEnd() + (param.questionToken ? 1 : 0);
                const opts: IExtraOptions = {};
                if (isArrow) {
                    opts.arrow = true;
                }
                if ( !hasParensAroundArguments(node)) {
                    opts.parens = [node.parameters[0].getStart(), node.parameters[0].getEnd()];
                }
                const params = [
                    JSON.stringify(param.name.getText()),
                    param.name.getText(),
                    typeInsertionPos,
                    JSON.stringify(fileName),
                    JSON.stringify(opts),
                ];
                const instrumentExpr = `$_$twiz(${params.join(',')})`;
                if (isShortArrow) {
                    replacements.push(Replacement.insert(node.body.getStart(), `(${instrumentExpr},`));
                    replacements.push(Replacement.insert(node.body.getEnd(), `)`));
                } else {
                    replacements.push(Replacement.insert(node.body.getStart() + 1, `${instrumentExpr};`));
                }
            }
        }
    }

    if (ts.isPropertyDeclaration(node) && ts.isIdentifier(node.name) && !node.type
        && !node.initializer && !node.decorators) {
        const name = node.name.getText();
        const params = [
            JSON.stringify(node.name.getText()),
            'value',
            node.name.getEnd() + (node.questionToken ? 1 : 0),
            JSON.stringify(fileName),
            JSON.stringify({}),
        ];
        const instrumentExpr = `$_$twiz(${params.join(',')});`;
        const preamble = `
            get ${name}() { return this._twiz_private_${name}; }
            set ${name}(value: any) { ${instrumentExpr} this._twiz_private_${name} = value; }
        `;
        // we need to remove any readonly modifiers, otherwise typescript will not let us update
        // our _twiz_private_... variable inside the setter.
        for (const modifier of node.modifiers || []) {
            if (modifier.kind === ts.SyntaxKind.ReadonlyKeyword) {
                replacements.push(Replacement.delete(modifier.getStart(), modifier.getEnd()));
            }
        }
        if (node.getStart() === node.name.getStart()) {
            replacements.push(Replacement.insert(node.getStart(), `${preamble} _twiz_private_`));
        } else {
            replacements.push(Replacement.insert(node.name.getStart(), '_twiz_private_'));
            replacements.push(Replacement.insert(node.getStart(), `${preamble}`));
        }
    }

    node.forEachChild((child) => visit(child, replacements, fileName));
}

const declaration =
    `declare function $_$twiz(name: string, value: any, pos: number, filename: string, opts: any): void;\n`;

export function instrument(source: string, fileName: string) {
    const sourceFile = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true);
    const replacements = [] as Replacement[];
    visit(sourceFile, replacements, fileName);
    if (replacements.length) {
        replacements.push(Replacement.insert(0, declaration));
    }
    return applyReplacements(source, replacements);
}
