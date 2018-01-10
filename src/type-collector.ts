import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';

export function getTypeCollectorSnippet() {
    const transpiled = ts.transpile(fs.readFileSync(path.join(__dirname, '/type-collector-snippet.ts'), 'utf-8'), {
        module: ts.ModuleKind.None,
        removeComments: true,
        target: ts.ScriptTarget.ES2015,
    });

    return `(function(host){
        exports = {};
        ${transpiled};
        host.$at = $at;
    })(typeof self !== 'undefined' ? self : this);\n`;
}
