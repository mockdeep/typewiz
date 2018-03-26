import * as ts from 'typescript';

export function typeCoverage(program: ts.Program) {
    const checker = program.getTypeChecker();

    const result = {
        knownTypes: 0,
        totalTypes: 0,
    };

    function visit(node: ts.Node) {
        if (ts.isIdentifier(node)) {
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

    return result;
}
