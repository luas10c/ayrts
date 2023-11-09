#!/usr/bin/env node

import { program } from 'commander'
import { builder } from './builder.js'
import { watch } from './watch.js'
import path from 'path'
import { tsconfigToSWCConfig } from './utils/tsconfig-to-swc.js'
import { workingDirectory } from './utils/runtime.js'

export interface AyrtsOptions {
  watch: boolean
  quiet: boolean
  entrypoint: string
  args: string[]
}

async function handler(ayrtsOptions: AyrtsOptions) {
  const entrypoint = ayrtsOptions.args[0]

  const config = tsconfigToSWCConfig('tsconfig.json')

  console.log(config)

  if (!entrypoint) {
    throw new Error('Entrypoint not provided')
  }

  const entrypointPath = path.resolve(path.join(workingDirectory, entrypoint))

  await builder(entrypointPath, ayrtsOptions, config)

  if (ayrtsOptions.watch) {
    await watch(entrypointPath, ayrtsOptions, config)
  }
}

program
  .name('ayrts')
  .description('CLI typescript builder')
  .option('-w, --watch', 'Watch directory')
  .option('-q, --quiet', 'Quiet mode')
  .action((args) => handler({ ...args, args: program.args }))
  .parse(process.argv)
