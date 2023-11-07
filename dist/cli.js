#!/usr/bin/env node
import { program } from 'commander';
import { builder } from './builder.js';
import { watch } from './watch.js';
program
    .name('ayrts')
    .description('CLI typescript builder')
    .option('-w, --watch', 'Watch directory', false);
async function handler(args) {
    await builder();
    await watch(args);
}
program.action(handler);
program.parse(process.argv);
