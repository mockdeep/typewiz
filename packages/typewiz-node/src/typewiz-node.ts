#!/usr/bin/env node

import { register } from './index';

register();

// Delegate the rest of the fun to ts-node:
require('ts-node/dist/_bin'); // tslint:disable-line:no-var-requires
