import * as ts from 'typescript';

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

export function visitorFactory(ctx: ts.TransformationContext, source: ts.SourceFile) {
    const visitor: ts.Visitor = (node: ts.Node): ts.Node => {
        if (ts.isSourceFile(node)) {
            return ts.updateSourceFileNode(node, [
                ...getDeclarationStatements(),
                ...ts.visitEachChild(node, visitor, ctx).statements,
            ]);
        }
        if (ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node)) {
            const instrumentStatements: ts.Statement[] = [];
            for (const param of node.parameters) {
                if (!param.type && !param.initializer && node.body) {
                    const typeInsertionPos = param.name.getEnd() + (param.questionToken ? 1 : 0);
                    // const opts: IExtraOptions = {};
                    // if (isArrow) {
                    //     opts.arrow = true;
                    // }
                    // if (!hasParensAroundArguments(node)) {
                    //     opts.parens = [node.parameters[0].getStart(), node.parameters[0].getEnd()];
                    // }
                    instrumentStatements.push(
                        ts.createStatement(
                            ts.createCall(
                                ts.createIdentifier('$_$twiz'),
                                [],
                                [
                                    ts.createLiteral(param.name.getText()),
                                    ts.createIdentifier(param.name.getText()),
                                    ts.createNumericLiteral(typeInsertionPos.toString()),
                                    ts.createLiteral(source.fileName),
                                    ts.createObjectLiteral(), // TODO: opts
                                ],
                            ),
                        ),
                    );
                }
            }
            if (ts.isFunctionDeclaration(node)) {
                return ts.visitEachChild(updateFunction(node, instrumentStatements), visitor, ctx);
            }
            if (ts.isMethodDeclaration(node)) {
                return ts.visitEachChild(updateMethod(node, instrumentStatements), visitor, ctx);
            }
        }

        return ts.visitEachChild(node, visitor, ctx);
    };

    return visitor;
}

export function transformer() {
    return (ctx: ts.TransformationContext): ts.Transformer<ts.SourceFile> => {
        return (source: ts.SourceFile) => ts.visitNode(source, visitorFactory(ctx, source));
    };
}

export function transformSourceFile(sourceFile: ts.SourceFile) {
    return ts.transform(sourceFile, [transformer()]).transformed[0];
}

export function transformSourceCode(sourceText: string, fileName: string) {
    const sourceFile = ts.createSourceFile(fileName, sourceText, ts.ScriptTarget.Latest, true);
    const transformed = transformSourceFile(sourceFile);
    const printer: ts.Printer = ts.createPrinter();
    return printer.printFile(transformed);
}
