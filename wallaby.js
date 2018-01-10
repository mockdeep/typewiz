module.exports = function (wallaby) {
    return {
        files: [
            'src/**/*.ts',
            'src/fixtures/*.html',
            { pattern: 'src/**/*.spec.ts', ignore: true },
        ],

        tests: ['src/**/*.spec.ts'],

        env: {
            type: 'node',
            runner: 'node'
        },

        testFramework: 'jest'
    };
};
