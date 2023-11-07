import path from 'node:path'
import { fork } from 'node:child_process'
import chokidar from 'chokidar'
import chalk from 'chalk'
import * as emoji from 'node-emoji'

import { constants } from './config/constants.js'

import { terminal } from './utils/terminal.js'

import { swc } from './builders/swc.js'

import { pids } from './config/pids.js'

export interface Args {
  watch: boolean
}

export async function watch(args: Args) {
  if (!args.watch) {
    return
  }

  const watcher = chokidar.watch(
    path.resolve(path.join(constants.relativePath, constants.entrypoint))
  )

  async function update(pathname: string) {
    const start = performance.now()

    try {
      terminal.clear()
      await swc.build({
        entrypoint: constants.entrypoint,
        path: pathname.split(constants.entrypoint).at(1)!
      })

      for (const pid of pids.values()) {
        try {
          process.kill(pid, 'SIGTERM')
        } catch {}

        pids.delete(pid)
      }

      const { pid } = fork(path.join(constants.relativePath, 'dist', 'main.js'))
      if (pid) {
        pids.add(pid)
      }

      const end = performance.now()

      console.log(
        chalk.green(
          `${emoji.get('heavy_check_mark')} Ready in ${Math.round(end - start)}ms`
        )
      )
    } catch (error) {
      console.log(chalk.red(`${emoji.get('heavy_multiplication_x')} Failed to compile`))
      console.log(error)
    }
  }

  watcher.on('change', update)
}
