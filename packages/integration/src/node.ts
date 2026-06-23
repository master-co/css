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
export const VIRTUAL_MODULE_DIR = 'node_modules/.master-css'
const VIRTUAL_MODULE_DIR_SEGMENTS = ['node_modules', '.master-css'] as const

export function toHashedManifestAssetFileName(json: string, basename = 'master-css-manifest') {
    const hash = createHash('sha256').update(json).digest('hex').slice(0, 8)
    return `${basename}.${hash}.json`
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

export function toVirtualDefaultManifestModulePath(context: string) {
    return join(context, ...VIRTUAL_MODULE_DIR_SEGMENTS, VIRTUAL_MANIFEST_FILE)
}

function encodeVirtualFilename(id: string) {
    return Buffer.from(id).toString('base64url')
}

export function toVirtualCSSManifestModulePath(context: string, file: string) {
    return join(context, ...VIRTUAL_MODULE_DIR_SEGMENTS, `${encodeVirtualFilename(file)}.manifest.js`)
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

export function ensureVirtualModuleFile(file: string, source: string) {
    mkdirSync(dirname(file), { recursive: true })
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
