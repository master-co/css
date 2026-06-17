import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import {
    EMPTY_PLAN_JSON,
    toVirtualDefaultPlanModulePath
} from './plan-module'
import { toInlinePlanModule } from './plan-facade'
import {
    EMPTY_PRELOADED_MODULE,
    toVirtualPreloadedModulePath
} from './preloaded-module'

export function ensureVirtualModuleFile(file: string, source: string) {
    mkdirSync(dirname(file), { recursive: true })
    if (!existsSync(file)) {
        writeFileSync(file, source)
    }
    return file
}

export function ensureVirtualPlanModulePath(projectDir = process.cwd()) {
    return ensureVirtualModuleFile(toVirtualDefaultPlanModulePath(projectDir), toInlinePlanModule(EMPTY_PLAN_JSON))
}

export function ensureVirtualPreloadedModulePath(projectDir = process.cwd()) {
    return ensureVirtualModuleFile(toVirtualPreloadedModulePath(projectDir), EMPTY_PRELOADED_MODULE)
}
