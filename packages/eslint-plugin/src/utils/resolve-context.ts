import type { RuleContext } from '@typescript-eslint/utils/ts-eslint'
import settings, { Settings } from '../settings'
import { MasterCSS, MasterCSSPlan, createCSS, defaultPlan } from './master-css'
import { findMasterCSSWorkspaceDirectoriesSync } from '@master/css-plan/css'
import { loadProjectPlanSync } from '@master/css-plan/load-sync'
import path from 'node:path'
import { existsSync } from 'node:fs'

declare interface CSSCache {
    cwd: string
    plan?: MasterCSSPlan,
    css: MasterCSS,
}

const cssCaches: CSSCache[] = []
const workspaceDirectoriesByCwd = new Map<string, string[]>()

function getContextFilename(context: RuleContext<any, any[]>) {
    const filename = context.physicalFilename || context.filename
    if (!filename || filename.startsWith('<')) return
    const resolvedFilename = path.isAbsolute(filename) ? filename : path.resolve(context.cwd, filename)
    return existsSync(resolvedFilename) ? resolvedFilename : undefined
}

function getWorkspaceDirectories(cwd: string) {
    let directories = workspaceDirectoriesByCwd.get(cwd)
    if (!directories) {
        directories = findMasterCSSWorkspaceDirectoriesSync(cwd)
        workspaceDirectoriesByCwd.set(cwd, directories)
    }
    return directories
}

function resolveWorkspaceDirectory(context: RuleContext<any, any[]>, filename: string) {
    const cwd = context.cwd || process.cwd()
    let closestDirectory: string | undefined
    for (const directory of getWorkspaceDirectories(cwd)) {
        if (
            (filename === directory || filename.startsWith(directory + path.sep))
            && (!closestDirectory || directory.length > closestDirectory.length)
        ) {
            closestDirectory = directory
        }
    }
    return closestDirectory || cwd
}

function resolvePlan(workspaceDir: string, plan?: MasterCSSPlan) {
    const result = loadProjectPlanSync(workspaceDir)
    return result.entries.length ? result.plan : plan
}

export default function resolveContext(context: RuleContext<any, any[]>) {
    const resolvedSettings = Object.assign({}, settings, context.settings?.['@master/css'])
    const filename = getContextFilename(context)
    const workspaceDir = filename ? resolveWorkspaceDirectory(context, filename) : context.cwd || process.cwd()
    let css = cssCaches.find(cache => cache.plan === resolvedSettings.plan &&
        cache.cwd === workspaceDir)?.css

    if (!css) {
        const plan = filename
            ? resolvePlan(workspaceDir, resolvedSettings.plan)
            : resolvedSettings.plan
        css = createCSS(plan || defaultPlan)
        cssCaches.push({ cwd: workspaceDir, plan: resolvedSettings.plan, css })
    }

    return {
        settings: resolvedSettings,
        options: context.options[0] || {},
        css
    }
}
