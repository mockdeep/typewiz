import * as child from 'child_process';
import * as path from 'path';

function readOutput(process: child.ChildProcess) {
    let output: string = '';
    return new Promise<string>((resolve, reject) => {
        process.stdout.on('data', (data) => (output += data));
        process.stderr.on('data', (data) => (output += data));
        process.on('close', (code) => {
            if (code) {
                reject(new Error(`Process exited with code ${code}\n${output}`));
            } else {
                resolve(output);
            }
        });
    });
}

function runCli(args: string[]) {
    const process = child.spawn('node', [path.join(__dirname, '../dist/cli'), ...args], { shell: true });
    return readOutput(process);
}

describe('typewiz CLI', () => {
    describe('coverage', () => {
        it(
            'should calculate the type coverage for the given tsconfig.json',
            async () => {
                const output = await runCli(['coverage', path.join(__dirname, '../fixtures/tsconfig.json')]);
                expect(output.trim()).toBe(`5 of 7 types are known.\n` + `Your type coverage is: 71.43%`);
            },
            10000,
        );
    });

    describe('instrument', () => {
        it(
            'should instrument the given source file',
            async () => {
                const output = await runCli(['instrument', path.join(__dirname, '../fixtures/instrument-test.ts')]);
                expect(output.trim()).toContain('function f(x) {$_$twiz(');
            },
            10000,
        );
    });
});
