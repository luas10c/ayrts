import { transformFile, Options } from '@swc/core'
import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { workingDirectory } from '../utils/runtime.js'
import debugLib from 'debug'

const debug = debugLib('ayrts:swc')

export type SwcOptions = Options

interface Item {
  baseUrl: string
  path: string
}

const defaultOptions = Object.freeze<Options>({
  jsc: {
    parser: {
      syntax: 'typescript',
      decorators: true,
      tsx: false
    },
    target: 'es2021',
    paths: {
      '#/*': ['./src/*'],
      '@/*': ['./src/*']
    }
  },
  module: {
    strict: true,
    type: 'es6'
  }
})

function mergeOptions<T>(target: T, source: Partial<T>): T {
  const destination = structuredClone(target)
  for (const property in source) {
    if (source.hasOwnProperty(property)) {
      const sourceProperty = source[property]
      if (
        sourceProperty &&
        typeof sourceProperty === 'object' &&
        !Array.isArray(sourceProperty) &&
        sourceProperty !== null
      ) {
        destination[property] = mergeOptions(target[property], sourceProperty)
      } else {
        if (sourceProperty !== undefined) {
          destination[property] = sourceProperty
        }
      }
    }
  }
  return destination
}

export async function swcBuild(item: Item, options?: SwcOptions) {
  try {
    let transformFileOptions = options

    if (!transformFileOptions) {
      transformFileOptions = mergeOptions(defaultOptions, {
        jsc: {
          baseUrl: item.baseUrl
        }
      })
    }

    const { code } = await transformFile(
      path.join(item.baseUrl, item.path),
      transformFileOptions
    )

    const { dir, name } = path.parse(item.path)

    const outDir = path.join(workingDirectory, options?.outputPath || 'dist')

    debug('File transpiled', path.join(outDir, dir, `${name}.js`))
    await writeFile(path.join(outDir, dir, `${name}.js`), code)
  } catch {}
}
