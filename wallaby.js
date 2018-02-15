module.exports = function(wallaby) {
    return {
        files: ['src/**/*.ts', { pattern: 'src/**/*.spec.ts', ignore: true }],

        tests: ['src/**/*.spec.ts'],

        env: {
            type: 'node',
            runner: 'node',
        },

        testFramework: 'jest',

        setup: () => {
            if (!global._vmPatched) {
                const vm = require('vm');
                const createContext = vm.createContext;
                const runInNewContext = vm.Script.prototype.runInNewContext;
                const wallabyGlobals = { $_$wp, $_$wpe, $_$w, $_$wf, $_$wv, $_$tracer };
                vm.createContext = function() {
                    arguments[0] = Object.assign(arguments[0] || {}, wallabyGlobals);
                    return createContext.apply(this, arguments);
                };
                vm.Script.prototype.runInNewContext = function() {
                    arguments[0] = Object.assign(arguments[0] || {}, wallabyGlobals);
                    return runInNewContext.apply(this, arguments);
                };
                global._vmPatched = true;
            }
        },
    };
};
