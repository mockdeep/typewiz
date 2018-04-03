#!/usr/bin/env node

import { register } from './index';

(async () => {
    if (process.argv.length > 3) {
        await register({ typewizConfig: process.argv[2] });
        process.argv.splice(2, 1);
    } else {
        await register();
    }

    // Delegate the rest of the fun to ts-node:
    require('ts-node/dist/_bin'); // tslint:disable-line:no-var-requires
})();
