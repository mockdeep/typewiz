import { chain, Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';
import { ISchema } from './schema';

export default function(options: ISchema): Rule {
    return chain([addTypewizToPackageJson]);
}

export function addTypewizToPackageJson(host: Tree, context: SchematicContext): Tree {
    if (host.exists('package.json')) {
        const sourceText = host.read('package.json')!.toString('utf-8');
        const json = JSON.parse(sourceText);

        // add dependency
        const type = 'devDependencies';
        json[type] = json[type] || {};
        json[type]['typewiz-webpack'] = '1.1.0';

        // add script
        const typewizAngularCommand = 'node node_modules/typewiz-angular/dist/cli';
        json.scripts = json.scripts || {};
        if (json.scripts.prepare) {
            if (json.scripts.prepare.indexOf('typewiz-angular') === -1) {
                json.scripts.prepare += ' && ' + typewizAngularCommand;
            }
        } else {
            json.scripts.prepare = typewizAngularCommand;
        }

        host.overwrite('package.json', JSON.stringify(json, null, 2));
        context.addTask(new NodePackageInstallTask());
    }

    return host;
}
