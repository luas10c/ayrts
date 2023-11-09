import path from 'node:path'
import { fork } from 'node:child_process'
import chokidar from 'chokidar'
import chalk from 'chalk'
import * as emoji from 'node-emoji'

import { clearTerminal } from './utils/terminal.js'

import { SwcOptions, swcBuild } from './builders/swc.js'

import { pids } from './store/pids.js'
import { workingDirectory } from './utils/runtime.js'
import { SWCConfig } from './utils/tsconfig-to-swc.js'
import { AyrtsOptions } from './cli.js'

export async function watch(
  entrypointPath: string,
  ayrtsOptions: AyrtsOptions,
  config?: SWCConfig
) {
  const entrypoint = path.basename(entrypointPath)

  const distEntrypoint = entrypoint.replace(/\.ts$/, '.js')

  const outDir = path.join(workingDirectory, config?.outputPath || 'dist')

  const watcher = chokidar.watch(entrypointPath)

  async function update(entrypointPath: string) {
    const start = performance.now()

    try {
      clearTerminal()
      await swcBuild(
        {
          baseUrl: path.dirname(entrypointPath),
          path: path.basename(entrypointPath)
        },
        config as SwcOptions
      )

      for (const pid of pids.values()) {
        try {
          process.kill(pid, 'SIGTERM')
        } catch {}

        pids.delete(pid)
      }

      const { pid } = fork(path.join(outDir, distEntrypoint))
      if (pid) {
        pids.add(pid)
      }

      const end = performance.now()

      if (!ayrtsOptions.quiet) {
        console.log(
          chalk.green(
            `${emoji.get('heavy_check_mark')} Ready in ${Math.round(end - start)}ms`
          )
        )
      }
    } catch (error) {
      console.log(chalk.red(`${emoji.get('heavy_multiplication_x')} Failed to compile`))
      console.log(error)
    }
  }

  watcher.on('change', update)
}
