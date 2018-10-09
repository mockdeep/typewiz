import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner } from '@angular-devkit/schematics/testing';
import * as path from 'path';

const collectionPath = path.join(__dirname, '../collection.json');

describe('my-full-schematic', () => {
    it('should install typewiz-webpack and add `prepare`, script to package.json', () => {
        const runner = new SchematicTestRunner('schematics', collectionPath);
        const inputTree = Tree.empty();
        inputTree.create('package.json', '{}');
        const tree = runner.runSchematic('ng-add', {}, inputTree);

        const packageJson = JSON.parse(tree.readContent('package.json'));
        expect(packageJson).toEqual({
            devDependencies: {
                typewiz: '1.2.0',
                ['typewiz-webpack']: '1.2.0',
            },
            scripts: {
                prepare: 'node node_modules/typewiz-angular/dist/cli',
                ['typewiz:apply-types']: 'typewiz applyTypes collected-types.json',
            },
        });
    });

    it('should upgrade typewiz-webpack to latest if it already exists', () => {
        const runner = new SchematicTestRunner('schematics', collectionPath);
        const inputTree = Tree.empty();
        inputTree.create(
            'package.json',
            JSON.stringify({
                devDependencies: {
                    'typewiz-webpack': '1.0.0',
                },
            }),
        );
        const tree = runner.runSchematic('ng-add', {}, inputTree);

        const packageJson = JSON.parse(tree.readContent('package.json'));
        expect(packageJson.devDependencies).toEqual({
            typewiz: '1.2.0',
            ['typewiz-webpack']: '1.2.0',
        });
    });

    it('should update the `prepare` script in package.json if it already exists', () => {
        const runner = new SchematicTestRunner('schematics', collectionPath);
        const inputTree = Tree.empty();
        inputTree.create(
            'package.json',
            JSON.stringify({
                scripts: {
                    prepare: 'npm run build',
                },
            }),
        );
        const tree = runner.runSchematic('ng-add', {}, inputTree);

        const packageJson = JSON.parse(tree.readContent('package.json'));
        expect(packageJson.scripts).toMatchObject({
            prepare: 'npm run build && node node_modules/typewiz-angular/dist/cli',
        });
    });

    it('should not update the `prepare` script if it already contains typewiz', () => {
        const runner = new SchematicTestRunner('schematics', collectionPath);
        const inputTree = Tree.empty();
        inputTree.create(
            'package.json',
            JSON.stringify({
                scripts: {
                    prepare: 'npm run build && node node_modules/typewiz-angular/dist/cli',
                },
            }),
        );
        const tree = runner.runSchematic('ng-add', {}, inputTree);

        const packageJson = JSON.parse(tree.readContent('package.json'));
        expect(packageJson.scripts).toMatchObject({
            prepare: 'npm run build && node node_modules/typewiz-angular/dist/cli',
        });
    });
});
