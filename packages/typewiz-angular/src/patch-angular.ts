import { tsquery } from '@phenomnomnominal/tsquery';
import * as fs from 'fs';
import * as path from 'path';
import { SourceFile } from 'typescript';
import { applyReplacements, Replacement } from 'typewiz-core/dist/replacement';

function hasRequireStatement(ast: SourceFile, packageName: string) {
    const matches = tsquery.query(ast, `CallExpression[expression.name=require][arguments.0.text="${packageName}"]`);
    return matches.length > 0;
}

export function patchCompiler(compilerSource: string) {
    const compilerAst = tsquery.ast(compilerSource);
    if (hasRequireStatement(compilerAst, 'typewiz-core')) {
        return compilerSource;
    }

    const [firstConst] = tsquery.query(compilerAst, 'VariableDeclarationList');
    const [makeTransformersMethod] = tsquery.query(compilerAst, 'MethodDeclaration[name.name=_makeTransformers]>Block');

    const replacements = [
        Replacement.insert(firstConst.getStart(), `const { typewizTransformer } = require('typewiz-core');\n`),
        Replacement.insert(
            makeTransformersMethod.getStart() + 1,
            `if (this._JitMode) { this._transformers.push(typewizTransformer({})); }`,
        ),
    ];
    return applyReplacements(compilerSource, replacements);
}

export function patchTypescriptModel(source: string) {
    const ast = tsquery.ast(source);
    if (hasRequireStatement(ast, 'typewiz-webpack')) {
        return source;
    }

    const [firstConst] = tsquery.query(ast, 'VariableDeclarationList');
    const [pluginListEnd] = tsquery.query(
        ast,
        'FunctionDeclaration[name.name=getNonAotConfig] ReturnStatement PropertyAssignment[name.name=plugins]' +
            ' ArrayLiteralExpression > :last-child',
    );

    const replacements = [
        Replacement.insert(firstConst.getStart(), `const { TypewizPlugin } = require('typewiz-webpack');\n`),
        Replacement.insert(pluginListEnd.getEnd(), `, new TypewizPlugin()`),
    ];
    return applyReplacements(source, replacements);
}

export function patchDevserver(source: string) {
    const ast = tsquery.ast(source);
    if (hasRequireStatement(ast, 'typewiz-webpack')) {
        return source;
    }

    const [firstConst] = tsquery.query(ast, 'VariableDeclarationList');
    const [webpackConfigObject] = tsquery.query(
        ast,
        'MethodDeclaration[name.name=_buildServerConfig] VariableDeclaration[name.name="config"] ' +
            'ObjectLiteralExpression',
    );

    const replacements = [
        Replacement.insert(
            firstConst.getStart(),
            `const { typewizCollectorMiddleware } = require('typewiz-webpack');\n`,
        ),
        Replacement.insert(
            webpackConfigObject.getEnd() - 1,
            `before(app) { typewizCollectorMiddleware(app, 'collected-types.json'); },`,
        ),
    ];
    return applyReplacements(source, replacements);
}

export function patchAngular(nodeModulesDir: string) {
    const compilerFilename = path.join(nodeModulesDir, '@ngtools/webpack/src/angular_compiler_plugin.js');
    fs.writeFileSync(compilerFilename, patchCompiler(fs.readFileSync(compilerFilename, 'utf-8')));

    const typescriptModelFilename = path.join(
        nodeModulesDir,
        '@angular-devkit/build-angular/src/angular-cli-files/models/webpack-configs/typescript.js',
    );
    fs.writeFileSync(typescriptModelFilename, patchTypescriptModel(fs.readFileSync(typescriptModelFilename, 'utf-8')));

    const devserverFilename = path.join(nodeModulesDir, '@angular-devkit/build-angular/src/dev-server/index.js');
    fs.writeFileSync(devserverFilename, patchDevserver(fs.readFileSync(devserverFilename, 'utf-8')));
}
