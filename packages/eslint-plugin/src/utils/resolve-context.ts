import type { RuleContext } from '@typescript-eslint/utils/ts-eslint'
import settings, { Settings } from '../settings'
import { MasterCSS, createCSS } from '@master/css'
import { findMasterCSSWorkspaceDirectoriesSync } from '@master/css-configer/css'
import { loadProjectConfigSync } from '@master/css-configer/load-sync'
import type { Config } from 'shared/css-config'
import path from 'node:path'
import { existsSync } from 'node:fs'

declare interface CSSCache {
    cwd: string
    config?: Config,
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

function resolveConfig(workspaceDir: string, config?: Config) {
    const result = loadProjectConfigSync(workspaceDir, { config })
    return result.entries.length ? result.config : config
}

export default function resolveContext(context: RuleContext<any, any[]>) {
    const resolvedSettings = Object.assign({}, settings, context.settings?.['@master/css'])
    const filename = getContextFilename(context)
    const workspaceDir = filename ? resolveWorkspaceDirectory(context, filename) : context.cwd || process.cwd()
    let css = cssCaches.find(cache => cache.config === resolvedSettings.config &&
        cache.cwd === workspaceDir)?.css

    if (!css) {
        const config = filename
            ? resolveConfig(workspaceDir, resolvedSettings.config)
            : resolvedSettings.config
        css = createCSS(config)
        cssCaches.push({ cwd: workspaceDir, config: resolvedSettings.config, css })
    }

    return {
        settings: resolvedSettings,
        options: context.options[0] || {},
        css
    }
}
