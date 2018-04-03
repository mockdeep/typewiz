import * as ts from 'typescript';

export function typeCoverage(program: ts.Program) {
    const checker = program.getTypeChecker();

    const result = {
        knownTypes: 0,
        percentage: 100,
        totalTypes: 0,
    };

    function visit(node: ts.Node) {
        if (
            ts.isIdentifier(node) &&
            (!node.parent || (!ts.isFunctionDeclaration(node.parent) && !ts.isClassDeclaration(node.parent)))
        ) {
            const type = checker.getTypeAtLocation(node);
            if (type) {
                result.totalTypes++;
                if (checker.typeToString(type) !== 'any') {
                    result.knownTypes++;
                }
            }
        }
        node.forEachChild(visit);
    }

    for (const sourceFile of program.getSourceFiles()) {
        if (!sourceFile.isDeclarationFile) {
            visit(sourceFile);
        }
    }

    if (result.totalTypes > 0) {
        result.percentage = 100 * result.knownTypes / result.totalTypes;
    }

    return result;
}
