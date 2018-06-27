import * as ts from 'typescript';
import { getProgram, ICompilerOptions } from './compiler-helper';
import { transformSourceFile } from './transformer';
import { TypewizError } from './typewiz-error';

export interface IInstrumentOptions extends ICompilerOptions {
    instrumentCallExpressions?: boolean;
    instrumentImplicitThis?: boolean;
    skipTwizDeclarations?: boolean;
}

export interface IExtraOptions {
    arrow?: boolean;
    parens?: [number, number];
    thisType?: boolean;
    thisNeedsComma?: boolean;
}

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
    if (!sourceFile) {
        throw new TypewizError(`File not found: ${fileName}`);
    }

    const transformed = transformSourceFile(sourceFile, options, program);
    return ts.createPrinter().printFile(transformed);
}
