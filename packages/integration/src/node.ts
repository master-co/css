import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import {
    EMPTY_CONFIG_MODULE,
    toVirtualDefaultConfigModulePath
} from './config-module'
import {
    EMPTY_PLAN_MODULE,
    toVirtualDefaultPlanModulePath
} from './plan-module'
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

export function ensureVirtualConfigModulePath(projectDir = process.cwd()) {
    return ensureVirtualModuleFile(toVirtualDefaultConfigModulePath(projectDir), EMPTY_CONFIG_MODULE)
}

export function ensureVirtualPlanModulePath(projectDir = process.cwd()) {
    return ensureVirtualModuleFile(toVirtualDefaultPlanModulePath(projectDir), EMPTY_PLAN_MODULE)
}

export function ensureVirtualPreloadedModulePath(projectDir = process.cwd()) {
    return ensureVirtualModuleFile(toVirtualPreloadedModulePath(projectDir), EMPTY_PRELOADED_MODULE)
}
