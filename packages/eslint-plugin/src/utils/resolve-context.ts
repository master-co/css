import type { RuleContext } from '@typescript-eslint/utils/ts-eslint'
import settings, { Settings } from '../settings'
import { MasterCSS, MasterCSSManifest, createCSS, defaultManifest } from './master-css'
import { findMasterCSSWorkspaceDirectoriesSync } from '@master/css-manifest/css'
import { loadProjectManifestSync } from '@master/css-manifest/load-sync'
import path from 'node:path'
import { existsSync } from 'node:fs'

declare interface CSSCache {
    cwd: string
    manifest?: MasterCSSManifest,
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

function findNearestPackageDirectory(filename: string) {
    let directory = path.dirname(filename)
    const root = path.parse(directory).root
    while (directory !== root) {
        if (existsSync(path.join(directory, 'package.json'))) return directory
        directory = path.dirname(directory)
    }
    return path.dirname(filename)
}

function resolveSearchDirectory(context: RuleContext<any, any[]>, filename: string) {
    const cwd = path.resolve(context.cwd || process.cwd())
    const root = path.parse(cwd).root
    if (cwd !== root && (filename === cwd || filename.startsWith(cwd + path.sep))) return cwd
    return findNearestPackageDirectory(filename)
}

function resolveWorkspaceDirectory(context: RuleContext<any, any[]>, filename: string) {
    const cwd = resolveSearchDirectory(context, filename)
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

function resolvePlan(workspaceDir: string, manifest?: MasterCSSManifest) {
    const result = loadProjectManifestSync(workspaceDir)
    return result.entries.length ? result.manifest : manifest
}

export default function resolveContext(context: RuleContext<any, any[]>) {
    const resolvedSettings = Object.assign({}, settings, context.settings?.['@master/css'])
    const filename = getContextFilename(context)
    const workspaceDir = filename ? resolveWorkspaceDirectory(context, filename) : context.cwd || process.cwd()
    let css = cssCaches.find(cache => cache.manifest === resolvedSettings.manifest &&
        cache.cwd === workspaceDir)?.css

    if (!css) {
        const manifest = filename
            ? resolvePlan(workspaceDir, resolvedSettings.manifest)
            : resolvedSettings.manifest
        css = createCSS(manifest || defaultManifest)
        cssCaches.push({ cwd: workspaceDir, manifest: resolvedSettings.manifest, css })
    }

    return {
        settings: resolvedSettings,
        options: context.options[0] || {},
        css
    }
}
