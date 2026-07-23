import { extname } from 'node:path'
import { createRequire } from 'node:module'
import {
  compileCSSManifestFile,
  compileCSSManifestJSON
} from '@master/css-compiler'
import {
  stripResourceQuery
} from '@master/css-internal-integration/manifest-module'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import {
  type LoadManifestOptions,
  type LoadManifestResult,
  type LoadProjectManifestOptions,
  type LoadProjectManifestResult
} from './options'
import { resolve } from 'node:path'
import { loadRustProjectManifest } from './rust-project'

const require = createRequire(import.meta.url)
const defaultManifest = require('@master/css-preset/default-manifest.json') as MasterCSSManifest

export type {
  LoadManifestOptions,
  LoadManifestResult,
  LoadProjectManifestOptions,
  LoadProjectManifestResult
} from './options'

export type ManifestJSONResult = ReturnType<typeof compileCSSManifestJSON>

function withDefaultManifest<T extends LoadManifestOptions>(options: T): T {
  return {
    ...options,
    baseManifest: options.baseManifest ?? defaultManifest
  }
}

export function loadManifestSync(path: string, options: LoadManifestOptions = {}): LoadManifestResult {
  if (extname(stripResourceQuery(path)) === '.css') {
    return compileCSSManifestFile(stripResourceQuery(path), withDefaultManifest(options))
  }
  throw new TypeError('Master CSS manifests can only be loaded from CSS files.')
}

export function loadManifestJSONSync(path: string, options: LoadManifestOptions = {}): ManifestJSONResult {
  if (extname(stripResourceQuery(path)) === '.css') {
    return compileCSSManifestJSON(stripResourceQuery(path), withDefaultManifest(options))
  }
  throw new TypeError('Master CSS manifest JSON can only be loaded from CSS files.')
}

export function loadProjectManifestSync(projectDir = process.cwd(), options: LoadProjectManifestOptions = {}): LoadProjectManifestResult {
  const result = loadRustProjectManifest(
    resolve(projectDir),
    options.baseManifest ?? defaultManifest,
    options.entries
  )
  result.warnings.forEach((warning) => options.onWarning?.(warning))
  return result
}

export function loadProjectManifestJSONSync(projectDir = process.cwd(), options: LoadProjectManifestOptions = {}) {
  const result = loadProjectManifestSync(projectDir, options)
  return { ...result, json: JSON.stringify(result.manifest) }
}
