import { extname } from 'node:path'
import {
    compileCSSPlanFile,
    compileCSSPlanModule,
    compileProjectPlan,
    compileProjectPlanModule
} from '@master/css-compiler'
import {
    stripResourceQuery
} from '@master/css-integration/plan-module'
import defaultPlan from '@master/css-preset/default-plan'
import {
    type LoadPlanOptions,
    type LoadPlanResult,
    type LoadProjectPlanOptions,
    type LoadProjectPlanResult
} from './options'
import { findCSSPlanEntryFiles } from './css'

export type {
    LoadPlanOptions,
    LoadPlanResult,
    LoadProjectPlanOptions,
    LoadProjectPlanResult
} from './options'

export type PlanModuleResult = ReturnType<typeof compileCSSPlanModule>

function withDefaultPlan<T extends LoadPlanOptions>(options: T): T {
    return {
        ...options,
        basePlan: options.basePlan ?? defaultPlan
    }
}

export async function loadPlan(path: string, options: LoadPlanOptions = {}): Promise<LoadPlanResult> {
    if (extname(stripResourceQuery(path)) === '.css') {
        return compileCSSPlanFile(stripResourceQuery(path), withDefaultPlan(options))
    }
    throw new TypeError('Master CSS plans can only be loaded from CSS files.')
}

export async function loadPlanModule(path: string, options: LoadPlanOptions = {}): Promise<PlanModuleResult> {
    if (extname(stripResourceQuery(path)) === '.css') {
        return compileCSSPlanModule(stripResourceQuery(path), withDefaultPlan(options))
    }
    throw new TypeError('Master CSS plan modules can only be loaded from CSS files.')
}

export async function loadProjectPlan(projectDir = process.cwd(), options: LoadProjectPlanOptions = {}): Promise<LoadProjectPlanResult> {
    const entries = options.entries ?? await findCSSPlanEntryFiles(projectDir)
    return compileProjectPlan(entries, {
        ...withDefaultPlan(options),
        root: projectDir
    })
}

export async function loadProjectPlanModule(projectDir = process.cwd(), options: LoadProjectPlanOptions = {}) {
    const entries = options.entries ?? await findCSSPlanEntryFiles(projectDir)
    return compileProjectPlanModule(entries, {
        ...withDefaultPlan(options),
        root: projectDir
    })
}
