import * as ts from 'typescript';

import { getProgram, ICompilerOptions } from './compiler-helper';
import { applyReplacements, Replacement } from './replacement';

export interface IInstrumentOptions extends ICompilerOptions {
    instrumentCallExpressions: boolean;
    instrumentImplicitThis: boolean;
}

export interface IExtraOptions {
    arrow?: boolean;
    parens?: [number, number];
    thisType?: boolean;
    comma?: boolean;
}

function hasParensAroundArguments(node: ts.FunctionLike) {
    if (ts.isArrowFunction(node)) {
        return (
            node.parameters.length !== 1 ||
            node
                .getText()
                .substr(0, node.equalsGreaterThanToken.getStart() - node.getStart())
                .includes('(')
        );
    } else {
        return true;
    }
}

function visit(
    node: ts.Node,
    replacements: Replacement[],
    fileName: string,
    options: IInstrumentOptions,
    program?: ts.Program,
) {
    const isArrow = ts.isArrowFunction(node);
    if (ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node) || ts.isArrowFunction(node)) {
        if (node.body) {
            // 'this' type inference requires at least typescript 2.5.0
            const needsThisInstrumentation =
                options.instrumentImplicitThis &&
                program &&
                (program.getTypeChecker() as any).tryGetThisTypeAt &&
                (program.getTypeChecker() as any).tryGetThisTypeAt(node) === undefined &&
                node.body.getText().includes('this');
            if (needsThisInstrumentation) {
                const opts: IExtraOptions = { thisType: true };
                if (node.parameters.length > 0) {
                    opts.comma = true;
                }
                const params = [
                    JSON.stringify('this'),
                    'this',
                    node.parameters.pos,
                    JSON.stringify(fileName),
                    JSON.stringify(opts),
                ];
                const instrumentExpr = `$_$twiz(${params.join(',')})`;

                replacements.push(Replacement.insert(node.body.getStart() + 1, `${instrumentExpr};`));
            }
        }

        const isShortArrow = ts.isArrowFunction(node) && !ts.isBlock(node.body);
        for (const param of node.parameters) {
            if (!param.type && !param.initializer && node.body) {
                const typeInsertionPos = param.name.getEnd() + (param.questionToken ? 1 : 0);
                const opts: IExtraOptions = {};
                if (isArrow) {
                    opts.arrow = true;
                }
                if (!hasParensAroundArguments(node)) {
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
                    replacements.push(Replacement.insert(node.body.getEnd(), `)`, 10));
                } else {
                    replacements.push(Replacement.insert(node.body.getStart() + 1, `${instrumentExpr};`));
                }
            }
        }
    }

    if (
        options.instrumentCallExpressions &&
        ts.isCallExpression(node) &&
        node.expression.getText() !== 'require.context'
    ) {
        for (const arg of node.arguments) {
            if (!ts.isStringLiteral(arg) && !ts.isNumericLiteral(arg)) {
                replacements.push(Replacement.insert(arg.getStart(), '$_$twiz.track('));
                replacements.push(Replacement.insert(arg.getEnd(), `,${JSON.stringify(fileName)},${arg.getStart()})`));
            }
        }
    }

    if (
        ts.isPropertyDeclaration(node) &&
        ts.isIdentifier(node.name) &&
        !node.type &&
        !node.initializer &&
        !node.decorators
    ) {
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

    node.forEachChild((child) => visit(child, replacements, fileName, options, program));
}

const declaration = `
    declare function $_$twiz(name: string, value: any, pos: number, filename: string, opts: any): void;
    declare namespace $_$twiz {
        function track<T>(v: T, p: number, f: string): T;
    }
`;

export function instrument(source: string, fileName: string, options?: IInstrumentOptions) {
    const instrumentOptions: IInstrumentOptions = {
        instrumentCallExpressions: false,
        instrumentImplicitThis: false,
        ...options,
    };
    const program: ts.Program | undefined = getProgram(instrumentOptions);
    const sourceFile = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true);
    const replacements = [] as Replacement[];
    visit(sourceFile, replacements, fileName, instrumentOptions, program);
    if (replacements.length) {
        replacements.push(Replacement.insert(0, declaration));
    }
    return applyReplacements(source, replacements);
}
