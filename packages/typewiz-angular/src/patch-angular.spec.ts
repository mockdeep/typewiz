import { patchCompiler, patchDevserver, patchTypescriptModel } from './patch-angular';

describe('patch-angular', () => {
    describe('patchCompiler', () => {
        it('should patch the compiler sources', () => {
            const input = `
                "use strict";
                Object.defineProperty(exports, "__esModule", { value: true });
                const core_1 = require("@angular-devkit/core");
                class AngularCompilerPlugin {
                    _makeTransformers() {
                        // foo
                    }
                }
            `;
            expect(patchCompiler(input)).toEqual(`
                "use strict";
                Object.defineProperty(exports, "__esModule", { value: true });
                const { typewizTransformer } = require('typewiz-core');
const core_1 = require("@angular-devkit/core");
                class AngularCompilerPlugin {
                    _makeTransformers() {this._transformers.push(typewizTransformer({}));
                        // foo
                    }
                }
            `);
        });
    });

    describe('patchTypescriptModel', () => {
        it('should patch the typescript model file', () => {
            const input = `
                "use strict";
                Object.defineProperty(exports, "__esModule", { value: true });
                const path = require("path");
                function getNonAotConfig(wco, host) {
                    const { tsConfigPath } = wco;
                    return {
                        module: { rules: [{ test: /\.ts$/, loader: webpackLoader }] },
                        plugins: [_createAotPlugin(wco, { tsConfigPath, skipCodeGeneration: true }, host)]
                    };
                }
            `;
            // tslint:disable:max-line-length
            expect(patchTypescriptModel(input)).toEqual(`
                "use strict";
                Object.defineProperty(exports, "__esModule", { value: true });
                const { TypewizPlugin } = require('typewiz-webpack');
const path = require("path");
                function getNonAotConfig(wco, host) {
                    const { tsConfigPath } = wco;
                    return {
                        module: { rules: [{ test: /\.ts$/, loader: webpackLoader }] },
                        plugins: [_createAotPlugin(wco, { tsConfigPath, skipCodeGeneration: true }, host), new TypewizPlugin()]
                    };
                }
            `);
        });
    });

    describe('patchDevServer', () => {
        it('should patch the devserver configuration', () => {
            const input = `
                "use strict";
                Object.defineProperty(exports, "__esModule", { value: true });
                const core_1 = require("@angular-devkit/core");
                class DevServerBuilder {
                    _buildServerConfig(root, projectRoot, options, browserOptions) {
                        const systemRoot = core_1.getSystemPath(root);
                        const servePath = this._buildServePath(options, browserOptions);
                        const config = {
                            headers: { 'Access-Control-Allow-Origin': '*' },
                        }
                    }
                }
            `;

            expect(patchDevserver(input)).toEqual(`
                "use strict";
                Object.defineProperty(exports, "__esModule", { value: true });
                const { typewizCollectorMiddleware } = require('typewiz-webpack');
const core_1 = require("@angular-devkit/core");
                class DevServerBuilder {
                    _buildServerConfig(root, projectRoot, options, browserOptions) {
                        const systemRoot = core_1.getSystemPath(root);
                        const servePath = this._buildServePath(options, browserOptions);
                        const config = {
                            headers: { 'Access-Control-Allow-Origin': '*' },
                        before(app) { typewizCollectorMiddleware(app, 'collected-types.json'); },}
                    }
                }
            `);
        });
    });
});
