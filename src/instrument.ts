import * as ts from 'typescript';

import { getProgram, ICompilerOptions } from './compiler-helper';
import { applyReplacements, Replacement } from './replacement';

export interface IInstrumentOptions extends ICompilerOptions {
    instrumentCallExpressions?: boolean;
    instrumentImplicitThis?: boolean;
    skipTwizDeclarations?: boolean;
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
    semanticDiagnostics?: ReadonlyArray<ts.Diagnostic>,
) {
    const isArrow = ts.isArrowFunction(node);
    if (ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node) || ts.isArrowFunction(node)) {
        if (node.body) {
            const needsThisInstrumentation =
                options.instrumentImplicitThis &&
                program &&
                semanticDiagnostics &&
                semanticDiagnostics.find((diagnostic) => {
                    if (
                        diagnostic.code === 2683 &&
                        diagnostic.file &&
                        diagnostic.file.fileName === node.getSourceFile().fileName &&
                        diagnostic.start
                    ) {
                        if (node.body && ts.isBlock(node.body)) {
                            const body = node.body as ts.FunctionBody;
                            return (
                                body.statements.find((statement) => {
                                    return (
                                        diagnostic.start !== undefined &&
                                        statement.pos <= diagnostic.start &&
                                        diagnostic.start <= statement.end
                                    );
                                }) !== undefined
                            );
                        } else {
                            const body = node.body as ts.Expression;
                            return body.pos <= diagnostic.start && diagnostic.start <= body.end;
                        }
                    }
                    return false;
                }) !== undefined;
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
            if (!ts.isStringLiteral(arg) && !ts.isNumericLiteral(arg) && !ts.isSpreadElement(arg)) {
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

    node.forEachChild((child) => visit(child, replacements, fileName, options, program, semanticDiagnostics));
}

const declaration = `
    declare function $_$twiz(name: string, value: any, pos: number, filename: string, opts: any): void;
    declare namespace $_$twiz {
        function track<T>(value: T, filename: string, offset: number): T;
        function track(value: any, filename: string, offset: number): any;
    }
`;

export function instrument(source: string, fileName: string, options?: IInstrumentOptions) {
    const instrumentOptions: IInstrumentOptions = {
        instrumentCallExpressions: false,
        instrumentImplicitThis: false,
        skipTwizDeclarations: false,
        ...options,
    };
    const program: ts.Program | undefined = getProgram(instrumentOptions);
    const sourceFile = program
        ? program.getSourceFile(fileName)
        : ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true);
    const replacements = [] as Replacement[];
    if (sourceFile) {
        const semanticDiagnostics = program ? program.getSemanticDiagnostics(sourceFile) : undefined;
        visit(sourceFile, replacements, fileName, instrumentOptions, program, semanticDiagnostics);
    }
    if (replacements.length && !instrumentOptions.skipTwizDeclarations) {
        replacements.push(Replacement.insert(0, declaration));
    }
    return applyReplacements(source, replacements);
}
