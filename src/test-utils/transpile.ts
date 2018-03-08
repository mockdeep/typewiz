import * as ts from 'typescript';

export function virtualCompilerHost(input: string, filename: string, compilerOptions: ts.CompilerOptions = {}) {
    const host = ts.createCompilerHost(compilerOptions);
    const old = host.getSourceFile;
    host.getSourceFile = (name: string, target: ts.ScriptTarget, ...args: any[]) => {
        if (name === filename) {
            return ts.createSourceFile(filename, input, target, true);
        }
        return old.call(host, name, target, ...args);
    };

    return host;
}

// similar to ts.transpile(), but also does type checking and throws in case of error
export function transpileSource(input: string, filename: string) {
    const compilerOptions = {
        target: ts.ScriptTarget.ES2015,
    };

    const host = virtualCompilerHost(input, filename, compilerOptions);

    let outputText;
    host.writeFile = (name: string, value: string) => {
        if (name.endsWith('.js')) {
            outputText = value;
        }
    };
    const program = ts.createProgram([filename], compilerOptions, host);
    const sourceFile = program.getSourceFile(filename);
    const diagnostics = [
        ...program.getDeclarationDiagnostics(sourceFile),
        ...program.getSemanticDiagnostics(sourceFile),
        ...program.getSyntacticDiagnostics(sourceFile),
    ];

    if (diagnostics.length) {
        throw new Error('Program transpilation failed: ' + diagnostics.map((d) => d.messageText).join(', '));
    }

    program.emit();

    return outputText;
}
