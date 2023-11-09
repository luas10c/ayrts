import { readFileSync } from 'fs'
import json5 from 'json5'
import path from 'path'

export type TSConfig = {
  compilerOptions: {
    target?: string
    module?: string
    sourceMap?: boolean
    experimentalDecorators?: boolean
    emitDecoratorMetadata?: boolean
    baseUrl?: string
    paths?: { [key: string]: string[] }
    outDir?: string
    strict?: boolean
  }
}

export type SWCConfig = {
  jsc: {
    target?: string
    parser?: {
      syntax?: string
      decorators?: boolean
      tsx?: boolean
    }
    baseUrl?: string
    paths?: { [key: string]: string[] }
    transform?: {
      legacyDecorator?: boolean
      decoratorMetadata?: boolean
    }
  }
  outputPath?: string
  module?: {
    strict?: boolean
    type?: string
  }
  sourceMaps?: boolean
}

const tsTargetToSwcTargetMap: Record<string, string> = {
  es3: 'es3',
  es5: 'es5',
  es6: 'es2015', // or 'es6'
  es2015: 'es2015',
  es2016: 'es2016',
  es2017: 'es2017',
  es2018: 'es2018',
  es2019: 'es2019',
  es2020: 'es2020',
  es2021: 'es2021',
  esnext: 'esnext'
}

const swcDefaultConfig: SWCConfig = {
  jsc: {
    target: 'es2021',
    parser: {
      syntax: 'typescript'
    }
  },
  outputPath: 'dist'
}

function convertTSConfigToSWCConfig(tsconfig: TSConfig): SWCConfig {
  const swcConfig: SWCConfig = {
    jsc: {
      target: tsconfig.compilerOptions.target?.toLowerCase(),
      parser: {
        syntax: 'typescript'
      }
    }
  }

  updateSwcOutputPath(swcConfig, tsconfig)
  updateSwcPaths(swcConfig, tsconfig)
  updateSwcTarget(swcConfig, tsconfig)
  updateSwcSourceMap(swcConfig, tsconfig)
  updateSwcModuleType(swcConfig, tsconfig)
  updateSwcExperimentalDecorators(swcConfig, tsconfig)
  updateSwcStrict(swcConfig, tsconfig)
  return swcConfig
}

function updateSwcStrict(swcConfig: SWCConfig, tsconfig: TSConfig) {
  if (tsconfig.compilerOptions.strict) {
    if (!swcConfig.module) {
      swcConfig.module = {}
    }
    swcConfig.module.strict = true
  }
}

function updateSwcOutputPath(swcConfig: SWCConfig, tsconfig: TSConfig) {
  if (tsconfig.compilerOptions.outDir) {
    swcConfig.outputPath = tsconfig.compilerOptions.outDir
  }
}

function updateSwcPaths(swcConfig: SWCConfig, tsconfig: TSConfig) {
  if (tsconfig.compilerOptions.baseUrl) {
    swcConfig.jsc.baseUrl = path.resolve(tsconfig.compilerOptions.baseUrl)
  } else {
    swcConfig.jsc.baseUrl = path.resolve('.')
  }

  if (tsconfig.compilerOptions.paths) {
    swcConfig.jsc.paths = tsconfig.compilerOptions.paths
  }
}

function updateSwcTarget(swcConfig: SWCConfig, tsconfig: TSConfig) {
  const tsTarget = tsconfig.compilerOptions.target
  if (tsTarget) {
    const normalizedTsTarget = tsTarget.toLowerCase()
    const swcTarget = tsTargetToSwcTargetMap[normalizedTsTarget]
    if (swcTarget) {
      swcConfig.jsc.target = swcTarget
    } else {
      console.warn(
        `TypeScript target ${tsTarget} is not supported by SWC. Using default '${swcDefaultConfig.jsc.target}'.`
      )
      swcConfig.jsc.target = swcDefaultConfig.jsc.target
    }
  }
}

function updateSwcExperimentalDecorators(swcConfig: SWCConfig, tsconfig: TSConfig) {
  if (tsconfig.compilerOptions.experimentalDecorators) {
    if (!swcConfig.jsc) {
      swcConfig.jsc = {}
    }
    if (!swcConfig.jsc.parser) {
      swcConfig.jsc.parser = {}
    }
    swcConfig.jsc.parser.decorators = true
  }

  if (tsconfig.compilerOptions.emitDecoratorMetadata) {
    if (!swcConfig.jsc) {
      swcConfig.jsc = {}
    }
    if (!swcConfig.jsc.transform) {
      swcConfig.jsc.transform = {}
    }
    swcConfig.jsc.transform.decoratorMetadata = true
  }

  if (swcConfig.jsc.transform?.decoratorMetadata && swcConfig.jsc.parser?.decorators) {
    swcConfig.jsc.transform.legacyDecorator = true
  }
}

function updateSwcSourceMap(swcConfig: SWCConfig, tsconfig: TSConfig) {
  if (tsconfig.compilerOptions.sourceMap) {
    swcConfig.sourceMaps = true
  }
}

function updateSwcModuleType(swcConfig: SWCConfig, tsconfig: TSConfig) {
  if (tsconfig.compilerOptions.module) {
    swcConfig.module = {
      type:
        tsconfig.compilerOptions.module.toLowerCase() === 'commonjs' ? 'commonjs' : 'es6'
    }
  }
}

function safelyParseJSON(jsonString: string): TSConfig | null {
  try {
    return json5.parse(jsonString)
  } catch (error) {
    console.error('Error parsing JSON:', error)
    return null
  }
}

export function tsconfigToSWCConfig(tsconfigPath: string): {
  tsconfig?: TSConfig
  swcconfig?: SWCConfig
} {
  try {
    const tsconfigRaw = readFileSync(tsconfigPath, { encoding: 'utf8' })
    const tsconfig = safelyParseJSON(tsconfigRaw)
    if (tsconfig) {
      const swcconfig = convertTSConfigToSWCConfig(tsconfig)
      return { tsconfig, swcconfig }
    }
  } catch (error) {
    console.error('Error reading file:', error)
  }
  return { swcconfig: swcDefaultConfig }
}
