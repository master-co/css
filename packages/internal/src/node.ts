import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import {
  EMPTY_MANIFEST_JSON,
  VIRTUAL_MANIFEST_FILE
} from './manifest-module'
import { toInlineManifestModule } from './manifest-facade'
import {
  EMPTY_EMITTED_GLOBALS_MODULE,
  VIRTUAL_EMITTED_GLOBALS_FILE
} from './emitted-globals-module'
import { MASTER_CSS_HYDRATION_MANIFEST_FILE_BASENAME } from '@master/css-schema/hydration-manifest'

export const RESOLVED_MASTER_CSS_MANIFEST_QUERY_PREFIX = '\0master-css-manifest:'
export const RESOLVED_MASTER_CSS_PROGRAM_QUERY_PREFIX = '\0master-css-program:'
export const VIRTUAL_MODULE_DIR = 'node_modules/.master-css'
const VIRTUAL_MODULE_DIR_SEGMENTS = ['node_modules', '.master-css'] as const
const VIRTUAL_MODULE_PACKAGE_JSON_SOURCE = '{\n    "type": "module"\n}\n'
const VIRTUAL_PROGRAM_FILE = 'master-css-program.js'

export function toHashedManifestAssetFileName(json: string, basename = 'master-css-manifest') {
  const hash = createHash('sha256').update(json).digest('hex').slice(0, 8)
  return `${basename}.${hash}.json`
}

/** `master-css-program.<hash>.bin`, so a changed program is a new immutable URL. */
export function toHashedProgramAssetFileName(program: Uint8Array) {
  const hash = createHash('sha256').update(program).digest('hex').slice(0, 8)
  return `master-css-program.${hash}.bin`
}

export function toHashedHydrationManifestAssetFileName(json: string) {
  return toHashedManifestAssetFileName(json, MASTER_CSS_HYDRATION_MANIFEST_FILE_BASENAME)
}

export function toResolvedMasterCSSManifestId(file: string) {
  return RESOLVED_MASTER_CSS_MANIFEST_QUERY_PREFIX + Buffer.from(file).toString('base64url')
}

export function fromResolvedMasterCSSManifestId(id: string) {
  return id.startsWith(RESOLVED_MASTER_CSS_MANIFEST_QUERY_PREFIX)
    ? Buffer.from(id.slice(RESOLVED_MASTER_CSS_MANIFEST_QUERY_PREFIX.length), 'base64url').toString()
    : undefined
}

export function toResolvedMasterCSSProgramId(file: string) {
  return RESOLVED_MASTER_CSS_PROGRAM_QUERY_PREFIX + Buffer.from(file).toString('base64url')
}

export function fromResolvedMasterCSSProgramId(id: string) {
  return id.startsWith(RESOLVED_MASTER_CSS_PROGRAM_QUERY_PREFIX)
    ? Buffer.from(id.slice(RESOLVED_MASTER_CSS_PROGRAM_QUERY_PREFIX.length), 'base64url').toString()
    : undefined
}

export function toVirtualDefaultManifestModulePath(context: string) {
  return join(context, ...VIRTUAL_MODULE_DIR_SEGMENTS, VIRTUAL_MANIFEST_FILE)
}

export function toVirtualDefaultProgramModulePath(context: string) {
  return join(context, ...VIRTUAL_MODULE_DIR_SEGMENTS, VIRTUAL_PROGRAM_FILE)
}

export function toVirtualModulePackageJSONPath(context: string) {
  return join(context, ...VIRTUAL_MODULE_DIR_SEGMENTS, 'package.json')
}

function encodeVirtualFilename(id: string) {
  return Buffer.from(id).toString('base64url')
}

export function toVirtualCSSManifestModulePath(context: string, file: string) {
  return join(context, ...VIRTUAL_MODULE_DIR_SEGMENTS, `${encodeVirtualFilename(file)}.manifest.js`)
}

/** The module a `?master-css-program` import of a CSS entry resolves to. */
export function toVirtualCSSProgramModulePath(context: string, file: string) {
  return join(context, ...VIRTUAL_MODULE_DIR_SEGMENTS, `${encodeVirtualFilename(file)}.program.js`)
}

export function toVirtualCSSManifestAssetPath(context: string, file: string) {
  return join(context, ...VIRTUAL_MODULE_DIR_SEGMENTS, `${encodeVirtualFilename(file)}.manifest.json`)
}

export function toVirtualCSSModulePath(context: string) {
  return join(context, ...VIRTUAL_MODULE_DIR_SEGMENTS, 'master-utilities.css')
}

export function toVirtualEmittedGlobalsModulePath(context: string) {
  return join(context, ...VIRTUAL_MODULE_DIR_SEGMENTS, VIRTUAL_EMITTED_GLOBALS_FILE)
}

function escapeRegExp(source: string) {
  return source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function createVirtualDefaultManifestModulePathPattern() {
  const source = [...VIRTUAL_MODULE_DIR_SEGMENTS, VIRTUAL_MANIFEST_FILE]
    .map(escapeRegExp)
    .join(String.raw`[/\\]`)
  return new RegExp(String.raw`(?:^|[/\\])${source}$`)
}

export function createVirtualDefaultProgramModulePathPattern() {
  const source = [...VIRTUAL_MODULE_DIR_SEGMENTS, VIRTUAL_PROGRAM_FILE]
    .map(escapeRegExp)
    .join(String.raw`[/\\]`)
  return new RegExp(String.raw`(?:^|[/\\])${source}$`)
}

export function createVirtualEmittedGlobalsModulePathPattern() {
  const source = [...VIRTUAL_MODULE_DIR_SEGMENTS, VIRTUAL_EMITTED_GLOBALS_FILE]
    .map(escapeRegExp)
    .join(String.raw`[/\\]`)
  return new RegExp(String.raw`(?:^|[/\\])${source}$`)
}

function ensureVirtualModuleDirectory(dir: string) {
  mkdirSync(dir, { recursive: true })
  const packageJSONPath = join(dir, 'package.json')
  try {
    if (readFileSync(packageJSONPath, 'utf8') === VIRTUAL_MODULE_PACKAGE_JSON_SOURCE) return dir
  } catch {
    // Create the package file below when it does not exist or cannot be read.
  }
  writeFileSync(packageJSONPath, VIRTUAL_MODULE_PACKAGE_JSON_SOURCE)
  return dir
}

export function ensureVirtualModulePackageJSONPath(projectDir = process.cwd()) {
  ensureVirtualModuleDirectory(join(projectDir, ...VIRTUAL_MODULE_DIR_SEGMENTS))
  return toVirtualModulePackageJSONPath(projectDir)
}

export function ensureVirtualModuleFile(file: string, source: string) {
  ensureVirtualModuleDirectory(dirname(file))
  try {
    if (readFileSync(file, 'utf8') === source) return file
  } catch {
    // Create the file below when it does not exist or cannot be read.
  }
  writeFileSync(file, source)
  return file
}

export function ensureVirtualManifestModulePath(projectDir = process.cwd()) {
  return ensureVirtualModuleFile(toVirtualDefaultManifestModulePath(projectDir), toInlineManifestModule(EMPTY_MANIFEST_JSON))
}

export function ensureVirtualEmittedGlobalsModulePath(projectDir = process.cwd()) {
  return ensureVirtualModuleFile(toVirtualEmittedGlobalsModulePath(projectDir), EMPTY_EMITTED_GLOBALS_MODULE)
}
