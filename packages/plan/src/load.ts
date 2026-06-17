import { extname } from 'node:path'
import { createRequire } from 'node:module'
import {
    compileCSSPlanFile,
    compileCSSPlanJSON,
    compileProjectPlan,
    compileProjectPlanJSON
} from '@master/css-compiler'
import {
    stripResourceQuery
} from '@master/css-integration/plan-module'
import type { MasterCSSPlan } from 'shared/master-css-plan'
import {
    type LoadPlanOptions,
    type LoadPlanResult,
    type LoadProjectPlanOptions,
    type LoadProjectPlanResult
} from './options'
import { findCSSPlanEntryFiles } from './css'

const require = createRequire(import.meta.url)
const defaultPlan = require('@master/css-preset/default-plan.json') as MasterCSSPlan

export type {
    LoadPlanOptions,
    LoadPlanResult,
    LoadProjectPlanOptions,
    LoadProjectPlanResult
} from './options'

export type PlanJSONResult = ReturnType<typeof compileCSSPlanJSON>

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

export async function loadPlanJSON(path: string, options: LoadPlanOptions = {}): Promise<PlanJSONResult> {
    if (extname(stripResourceQuery(path)) === '.css') {
        return compileCSSPlanJSON(stripResourceQuery(path), withDefaultPlan(options))
    }
    throw new TypeError('Master CSS plan JSON can only be loaded from CSS files.')
}

export async function loadProjectPlan(projectDir = process.cwd(), options: LoadProjectPlanOptions = {}): Promise<LoadProjectPlanResult> {
    const entries = options.entries ?? await findCSSPlanEntryFiles(projectDir)
    return compileProjectPlan(entries, {
        ...withDefaultPlan(options),
        root: projectDir
    })
}

export async function loadProjectPlanJSON(projectDir = process.cwd(), options: LoadProjectPlanOptions = {}) {
    const entries = options.entries ?? await findCSSPlanEntryFiles(projectDir)
    return compileProjectPlanJSON(entries, {
        ...withDefaultPlan(options),
        root: projectDir
    })
}
