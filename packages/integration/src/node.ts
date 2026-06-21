import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import {
    EMPTY_PLAN_JSON,
    VIRTUAL_PLAN_FILE
} from './plan-module'
import { toInlinePlanModule } from './plan-facade'
import {
    EMPTY_PRELOADED_MODULE,
    VIRTUAL_PRELOADED_FILE
} from './preloaded-module'

export const RESOLVED_MASTER_CSS_PLAN_QUERY_PREFIX = '\0master-css-plan:'
export const VIRTUAL_MODULE_DIR = 'node_modules/.master-css'

export function toHashedPlanAssetFileName(json: string, basename = 'master-css-plan') {
    const hash = createHash('sha256').update(json).digest('hex').slice(0, 8)
    return `${basename}.${hash}.json`
}

export function toResolvedMasterCSSPlanId(file: string) {
    return RESOLVED_MASTER_CSS_PLAN_QUERY_PREFIX + Buffer.from(file).toString('base64url')
}

export function fromResolvedMasterCSSPlanId(id: string) {
    return id.startsWith(RESOLVED_MASTER_CSS_PLAN_QUERY_PREFIX)
        ? Buffer.from(id.slice(RESOLVED_MASTER_CSS_PLAN_QUERY_PREFIX.length), 'base64url').toString()
        : undefined
}

export function toVirtualDefaultPlanModulePath(context: string) {
    return join(context, VIRTUAL_MODULE_DIR, VIRTUAL_PLAN_FILE)
}

function encodeVirtualFilename(id: string) {
    return Buffer.from(id).toString('base64url')
}

export function toVirtualCSSPlanModulePath(context: string, file: string) {
    return join(context, VIRTUAL_MODULE_DIR, `${encodeVirtualFilename(file)}.plan.js`)
}

export function toVirtualCSSPlanAssetPath(context: string, file: string) {
    return join(context, VIRTUAL_MODULE_DIR, `${encodeVirtualFilename(file)}.plan.json`)
}

export function toVirtualCSSModulePath(context: string) {
    return join(context, VIRTUAL_MODULE_DIR, 'master-utilities.css')
}

export function toVirtualPreloadedModulePath(context: string) {
    return join(context, VIRTUAL_MODULE_DIR, VIRTUAL_PRELOADED_FILE)
}

function escapeRegExp(source: string) {
    return source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function createVirtualDefaultPlanModulePathPattern() {
    const source = [...VIRTUAL_MODULE_DIR.split('/'), VIRTUAL_PLAN_FILE]
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

export function ensureVirtualPlanModulePath(projectDir = process.cwd()) {
    return ensureVirtualModuleFile(toVirtualDefaultPlanModulePath(projectDir), toInlinePlanModule(EMPTY_PLAN_JSON))
}

export function ensureVirtualPreloadedModulePath(projectDir = process.cwd()) {
    return ensureVirtualModuleFile(toVirtualPreloadedModulePath(projectDir), EMPTY_PRELOADED_MODULE)
}
