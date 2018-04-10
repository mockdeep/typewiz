#!/usr/bin/env node

import * as program from 'commander';
import * as fs from 'fs';
import { applyTypes, ConfigurationParser, instrument } from 'typewiz-core';
import * as updateNotifier from 'update-notifier';

// tslint:disable:no-console

// tslint:disable:no-var-requires
const pkg = require('../package.json');
updateNotifier({ pkg }).notify();

interface ICliOptions {
    config?: string;
    output?: string;
    inplace?: boolean;
    prefix?: string;
}

function getConfig(options: ICliOptions) {
    const config = new ConfigurationParser();
    const configFile = config.findConfigFile(process.cwd());
    if (options.config) {
        config.parseSync(options.config);
    } else if (configFile) {
        config.parseSync(configFile);
    }
    return config;
}

function instrumentHandler(files: string[], opts: ICliOptions) {
    const config = getConfig(opts).getInstrumentOptions();
    for (const file of files) {
        const source = fs.readFileSync(file, 'utf-8');
        const result = instrument(source, file, config);
        if (opts.inplace) {
            fs.writeFileSync(file, result);
        } else if (opts.output) {
            fs.writeFileSync(opts.output, result);
        } else {
            console.log(result);
        }
    }
}

function applyTypesHandler(typesJson: string, opts: ICliOptions) {
    const config = getConfig(opts).getApplyTypesOptions();
    if (opts.prefix) {
        config.prefix = opts.prefix;
    }
    const types = JSON.parse(fs.readFileSync(typesJson, 'utf-8'));
    applyTypes(types, config);
}

program
    .version(pkg.version)
    .option('-c, --config <typewiz.json>', 'Path to config file')

    .command('instrument <filename.ts...>')
    .option('-o, --output <instrumented.ts>', 'Specify output file (stdout by default)')
    .option('-p, --inplace', 'Instrument in place - overwrite the input files')
    .action(instrumentHandler);

program
    .command('applyTypes <collectedTypes.json>')
    .alias('apply')
    .option('-p, --prefix <prefix>', 'Add a prefix to all ')
    .action(applyTypesHandler);

program.action(() => {
    program.help();
});

program.parse(process.argv);
