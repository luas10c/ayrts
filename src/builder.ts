import { readdir, mkdir, stat } from 'node:fs/promises'
import { fork } from 'node:child_process'
import { rimraf } from 'rimraf'
import path from 'node:path'
import chalk from 'chalk'
import * as emoji from 'node-emoji'

import { clearTerminal } from './utils/terminal.js'

import { SwcOptions, swcBuild } from './builders/swc.js'

import { pids } from './store/pids.js'
import { workingDirectory } from './utils/runtime.js'
import { SWCConfig } from './utils/tsconfig-to-swc.js'
import { AyrtsOptions } from './cli.js'

async function* scan(entrypointPath: string) {
  const baseUrl = path.dirname(entrypointPath)

  const allPaths = await readdir(baseUrl, {
    recursive: true
  })

  for (const pathItem of allPaths) {
    if (pathItem.match(/node_modules|dist|.git|.github/)) {
      continue
    }

    const info = await stat(path.resolve(path.join(baseUrl, pathItem)))

    if (info.isDirectory()) {
      yield {
        isFile: false,
        baseUrl,
        path: pathItem
      }
    }

    const extensions = ['.ts', '.js']
    if (!extensions.includes(path.extname(pathItem))) {
      continue
    }

    yield {
      isFile: info.isFile(),
      baseUrl,
      path: pathItem
    }
  }
}

export async function builder(
  entrypointPath: string,
  ayrtsOptions: AyrtsOptions,
  config?: SWCConfig
) {
  const entrypoint = path.basename(entrypointPath)

  const distEntrypoint = entrypoint.replace(/\.ts$/, '.js')

  const outDir = path.join(workingDirectory, config?.outputPath ?? 'dist')

  const start = performance.now()

  try {
    clearTerminal()
    await rimraf(outDir)
    await mkdir(outDir)

    for await (const item of scan(entrypointPath)) {
      if (!item.isFile) {
        await mkdir(path.join(outDir, item.path))
        continue
      }
      await swcBuild(item, config as SwcOptions)
    }

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
