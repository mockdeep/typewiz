import * as ts from 'typescript';

export interface ICompilerOptions {
    /**
     * If given, all the file paths in the collected type info will be resolved relative to this directory.
     */
    rootDir?: string;

    /**
     * Path to your project's tsconfig file
     */
    tsConfig?: string;

    // You probably never need to touch these two - they are used by the integration tests to setup
    // a virtual file system for TS:
    tsConfigHost?: ts.ParseConfigHost;
    tsCompilerHost?: ts.CompilerHost;
}

export function getProgram(options: ICompilerOptions) {
    let program: ts.Program | undefined;
    if (options.tsConfig) {
        const configHost = options.tsConfigHost || ts.sys;
        const { config, error } = ts.readConfigFile(options.tsConfig, configHost.readFile);
        if (error) {
            throw new Error(`Error while reading ${options.tsConfig}: ${error.messageText}`);
        }

        const parsed = ts.parseJsonConfigFileContent(config, configHost, options.rootDir || '');
        if (parsed.errors.length) {
            const errors = parsed.errors.map((e) => e.messageText).join(', ');
            throw new Error(`Error while parsing ${options.tsConfig}: ${errors}`);
        }

        program = ts.createProgram(parsed.fileNames, parsed.options, options.tsCompilerHost);
    }
    return program;
}
