#!/usr/bin/env node

import { program } from 'commander'
import { builder } from './builder.js'
import { watch } from './watch.js'
import path from 'path'
import { SWCConfig, TSConfig, tsconfigToSWCConfig } from './utils/tsconfig-to-swc.js'
import { workingDirectory } from './utils/runtime.js'

export interface AyrtsOptions {
  watch: boolean
  quiet: boolean
  entrypoint: string
  args: string[]
  resolved?: {
    baseUrl?: string
  }
}

function resolveAyrtsOptions(
  ayrtsOptions: AyrtsOptions,
  config: {
    tsconfig?: TSConfig | undefined
    swcconfig?: SWCConfig | undefined
  }
) {
  if (!ayrtsOptions.resolved) {
    ayrtsOptions.resolved = {}
  }
  ayrtsOptions.resolved.baseUrl = config.tsconfig?.compilerOptions?.baseUrl ?? '.'
}

async function handler(ayrtsOptions: AyrtsOptions) {
  const entrypoint = ayrtsOptions.args[0]

  if (!entrypoint) {
    throw new Error('Entrypoint not provided')
  }

  const config = tsconfigToSWCConfig('tsconfig.json')

  if (!config) {
    throw new Error('Error parsing tsconfig')
  }

  resolveAyrtsOptions(ayrtsOptions, config)

  const entrypointPath = path.resolve(path.join(workingDirectory, entrypoint))

  await builder(entrypointPath, ayrtsOptions, config.swcconfig)

  if (ayrtsOptions.watch) {
    await watch(entrypointPath, ayrtsOptions, config.swcconfig)
  }
}

program
  .name('ayrts')
  .description('CLI typescript builder')
  .option('-w, --watch', 'Watch directory')
  .option('-q, --quiet', 'Quiet mode')
  .action((args) => handler({ ...args, args: program.args }))
  .parse(process.argv)
