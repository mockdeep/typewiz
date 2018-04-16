import { getCacheKey, process as originalProcess } from 'ts-jest';
import { JestConfig, Path, TransformOptions } from 'ts-jest/dist/jest-types';
import { instrument } from 'typewiz-core';

function process(
    src: string,
    filePath: Path,
    jestConfig: JestConfig,
    transformOptions: TransformOptions = { instrument: false },
) {
    src =
        `require('typewiz-node').register();` +
        instrument(src, filePath, {
            instrumentCallExpressions: true,
            instrumentImplicitThis: true,
            tsConfig: 'tsconfig.json', // TODO read it from jest config?
        });
    return originalProcess(src, filePath, jestConfig, transformOptions);
}

export { getCacheKey, process };
