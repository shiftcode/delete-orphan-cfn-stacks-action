import {pathsToModuleNameMapper} from 'ts-jest'
import tsConfig from './tsconfig.spec.json' assert {type: 'json'}

/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  // [...]
  preset: 'ts-jest/presets/default-esm', // or other ESM presets
  transform: {
    // '^.+\\.[tj]sx?$' to process js/ts with `ts-jest`
    // '^.+\\.m?[tj]sx?$' to process js/ts/mjs/mts with `ts-jest`
    '^.+\\.ts$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: 'tsconfig.spec.json'
      },
    ],
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    ...pathsToModuleNameMapper(tsConfig.compilerOptions.paths ?? {})
  },
}