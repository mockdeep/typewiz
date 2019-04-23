import * as ts from 'typescript';
import { IExtraOptions, IInstrumentOptions } from './instrument';

const declaration = `
    declare function $_$twiz(name: string, value: any, pos: number, filename: string, opts: any): void;
    declare namespace $_$twiz {
        function track<T>(value: T, filename: string, offset: number): T;
        function track(value: any, filename: string, offset: number): any;
    }
`;

function getDeclarationStatements() {
    const sourceFile = ts.createSourceFile('twiz-declarations.ts', declaration, ts.ScriptTarget.Latest);
    return sourceFile.statements;
}

function updateFunction(node: ts.FunctionDeclaration, instrumentStatements: ReadonlyArray<ts.Statement>) {
    return ts.updateFunctionDeclaration(
        node,
        node.decorators,
        node.modifiers,
        node.asteriskToken,
        node.name,
        node.typeParameters,
        node.parameters,
        node.type,
        ts.createBlock([...instrumentStatements, ...(node.body ? node.body.statements : [])]),
    );
}

function updateMethod(node: ts.MethodDeclaration, instrumentStatements: ReadonlyArray<ts.Statement>) {
    return ts.updateMethod(
        node,
        node.decorators,
        node.modifiers,
        node.asteriskToken,
        node.name,
        node.questionToken,
        node.typeParameters,
        node.parameters,
        node.type,
        ts.createBlock([...instrumentStatements, ...(node.body ? node.body.statements : [])]),
    );
}

function updateArrow(node: ts.ArrowFunction, instrumentStatements: ReadonlyArray<ts.ExpressionStatement>) {
    const newBody = ts.isBlock(node.body)
        ? ts.createBlock([...instrumentStatements, ...node.body.statements])
        : ts.createCommaList([...instrumentStatements.map((s) => s.expression), node.body]);

    return ts.updateArrowFunction(
        node,
        node.modifiers,
        node.typeParameters,
        node.parameters,
        node.type,
        node.equalsGreaterThanToken,
        newBody,
    );
}

function hasParensAroundArguments(node: ts.FunctionLike) {
    if (ts.isArrowFunction(node)) {
        const parameterStartPos = node.modifiers ? Math.max(...node.modifiers.map((mod) => mod.end)) : node.pos;
        return node.parameters.length !== 1 || node.parameters[0].pos !== parameterStartPos;
    } else {
        return true;
    }
}

function isRequireContextExpression(node: ts.Expression) {
    return (
        ts.isPropertyAccessExpression(node) &&
        ts.isIdentifier(node.expression) &&
        node.expression.text === 'require' &&
        ts.isIdentifier(node.name) &&
        node.name.text === 'context'
    );
}

function needsThisInstrumentation(
    node: ts.FunctionDeclaration | ts.ArrowFunction | ts.MethodDeclaration,
    semanticDiagnostics?: ReadonlyArray<ts.Diagnostic>,
) {
    return (
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
        }) !== undefined
    );
}

function createTwizInstrumentStatement(name: string, fileOffset: number, filename: string, opts: IExtraOptions) {
    return ts.createStatement(
        ts.createCall(
            ts.createIdentifier('$_$twiz'),
            [],
            [
                ts.createLiteral(name),
                ts.createIdentifier(name),
                ts.createNumericLiteral(fileOffset.toString()),
                ts.createLiteral(filename),
                ts.createLiteral(JSON.stringify(opts)),
            ],
        ),
    );
}

function removeInitializerFromBindingElement(node: ts.BindingElement) {
    return ts.updateBindingElement(
        node,
        node.dotDotDotToken,
        node.propertyName,
        removeInitializerFromBindingName(node.name),
        undefined,
    );
}

function removeInitializerFromBindingName(node: ts.BindingName): ts.BindingName {
    if (ts.isObjectBindingPattern(node)) {
        return ts.updateObjectBindingPattern(node, node.elements.map(removeInitializerFromBindingElement));
    } else if (ts.isArrayBindingPattern(node)) {
        return ts.updateArrayBindingPattern(node, node.elements.map(removeInitializerFromBindingElement));
    } else {
        return node;
    }
}

function getParameterName(param: ts.ParameterDeclaration) {
    const { name } = param;
    if (ts.isObjectBindingPattern(name) || ts.isArrayBindingPattern(name)) {
        const cleanName = removeInitializerFromBindingName(name);
        return ts.createPrinter().printNode(ts.EmitHint.Unspecified, cleanName, param.getSourceFile());
    } else {
        return param.name.getText();
    }
}

function visitorFactory(
    ctx: ts.TransformationContext,
    source: ts.SourceFile,
    options: IInstrumentOptions,
    semanticDiagnostics?: ReadonlyArray<ts.Diagnostic>,
) {
    const visitor: ts.Visitor = (originalNode: ts.Node): ts.Node | ts.Node[] => {
        const node = ts.visitEachChild(originalNode, visitor, ctx);

        if (ts.isSourceFile(node)) {
            return ts.updateSourceFileNode(node, [...getDeclarationStatements(), ...node.statements]);
        }

        const isArrow = ts.isArrowFunction(node);
        if ((ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node) || ts.isArrowFunction(node)) && node.body) {
            const instrumentStatements: ts.ExpressionStatement[] = [];
            if (options.instrumentImplicitThis && needsThisInstrumentation(node, semanticDiagnostics)) {
                const opts: IExtraOptions = { thisType: true };
                if (node.parameters.length > 0) {
                    opts.thisNeedsComma = true;
                }

                instrumentStatements.push(
                    createTwizInstrumentStatement('this', node.parameters.pos, source.fileName, opts),
                );
            }

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
                    const parameterName = getParameterName(param);
                    instrumentStatements.push(
                        createTwizInstrumentStatement(parameterName, typeInsertionPos, source.fileName, opts),
                    );
                }
            }
            if (ts.isFunctionDeclaration(node)) {
                return updateFunction(node, instrumentStatements);
            }
            if (ts.isMethodDeclaration(node)) {
                return updateMethod(node, instrumentStatements);
            }
            if (ts.isArrowFunction(node)) {
                return updateArrow(node, instrumentStatements);
            }
        }

        if (options.instrumentCallExpressions && ts.isCallExpression(node) && !isRequireContextExpression(node)) {
            const newArguments = [];
            for (const arg of node.arguments) {
                if (
                    node.getSourceFile() &&
                    !ts.isStringLiteral(arg) &&
                    !ts.isNumericLiteral(arg) &&
                    !ts.isSpreadElement(arg)
                ) {
                    newArguments.push(
                        ts.createCall(
                            ts.createPropertyAccess(ts.createIdentifier('$_$twiz'), ts.createIdentifier('track')),
                            undefined,
                            [
                                arg,
                                ts.createLiteral(source.fileName),
                                ts.createNumericLiteral(arg.getStart().toString()),
                            ],
                        ),
                    );
                } else {
                    newArguments.push(arg);
                }
            }

            return ts.updateCall(node, node.expression, node.typeArguments, newArguments);
        }

        if (
            ts.isPropertyDeclaration(node) &&
            ts.isIdentifier(node.name) &&
            !node.type &&
            !node.initializer &&
            !node.decorators
        ) {
            const privatePropName = '_twiz_private_' + node.name.text;
            const typeInsertionPos = node.name.getEnd() + (node.questionToken ? 1 : 0);
            return [
                //  dummy property
                ts.updateProperty(
                    node,
                    undefined,
                    [ts.createToken(ts.SyntaxKind.PrivateKeyword)],
                    privatePropName,
                    node.questionToken,
                    node.type,
                    node.initializer,
                ),

                // getter
                ts.createGetAccessor(
                    node.decorators,
                    undefined,
                    node.name,
                    [],
                    node.type,
                    ts.createBlock([ts.createReturn(ts.createPropertyAccess(ts.createThis(), privatePropName))]),
                ),

                // setter
                ts.createSetAccessor(
                    undefined,
                    undefined,
                    node.name,
                    [
                        ts.createParameter(
                            undefined,
                            undefined,
                            undefined,
                            node.name.text,
                            node.type,
                            ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword),
                        ),
                    ],
                    ts.createBlock([
                        createTwizInstrumentStatement(node.name.text, typeInsertionPos, source.fileName, {}),
                        // assign value to privatePropName
                        ts.createStatement(
                            ts.createAssignment(
                                ts.createPropertyAccess(ts.createThis(), privatePropName),
                                ts.createIdentifier(node.name.text),
                            ),
                        ),
                    ]),
                ),
            ];
        }

        return node;
    };

    return visitor;
}

export function typewizTransformer(options: IInstrumentOptions, program?: ts.Program) {
    return (ctx: ts.TransformationContext): ts.Transformer<ts.SourceFile> => {
        return (source: ts.SourceFile) => {
            const semanticDiagnostics =
                options.instrumentImplicitThis && program ? program.getSemanticDiagnostics(source) : undefined;
            return ts.visitNode(source, visitorFactory(ctx, source, options, semanticDiagnostics));
        };
    };
}

export function transformSourceFile(sourceFile: ts.SourceFile, options: IInstrumentOptions = {}, program?: ts.Program) {
    return ts.transform(sourceFile, [typewizTransformer(options, program)]).transformed[0];
}
