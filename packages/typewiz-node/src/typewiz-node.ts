#!/usr/bin/env node

import { register } from './index';

register();

// Delegate the rest of the fun to ts-node:
require('ts-node/dist/bin'); // tslint:disable-line:no-var-requires
