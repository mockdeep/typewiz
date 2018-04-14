const path = require('path');

module.exports = {
    moduleFileExtensions: ['ts', 'js'],
    transform: {
        '\\.ts$': 'ts-jest',
    },
    testMatch: ['**/*.spec.ts'],
    collectCoverageFrom: ['src/**.ts', '!src/**.spec.ts'],
    globals: {
        'ts-jest': {
            tsConfigFile: path.join(__dirname, 'tsconfig.json'),
        },
    },
};
