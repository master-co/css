import type { RuleContext } from '@typescript-eslint/utils/ts-eslint'
import settings, { Settings } from '../settings'
import { MasterCSSManifest, defaultManifest } from './master-css'
import {
  discoverManifestEntriesSync,
  loadProjectManifestSync
} from '@master/css-compiler/project/sync'
import { discoverBuildWorkspaceDirectoriesSync } from '@master/css-internal/workspace-directories'
import path from 'node:path'
import { existsSync } from 'node:fs'
import isSameOrChildPath from './is-same-or-child-path'
import type { MasterCSSToolingSession } from '@master/css-tooling'
import { createToolingSessionSync } from '@master/css-tooling/node'

declare interface CSSCache {
  cwd: string
  manifest?: MasterCSSManifest,
  tooling: MasterCSSToolingSession
}

declare interface SourceCache {
  cssCaches: CSSCache[]
  references: number
  workspaceDirectoriesByCwd: Map<string, string[]>
}

const sourceCaches = new WeakMap<object, SourceCache>()

function getContextFilename(context: RuleContext<any, any[]>) {
  const filename = context.physicalFilename || context.filename
  if (!filename || filename.startsWith('<')) return
  return path.isAbsolute(filename) ? filename : path.resolve(context.cwd, filename)
}

function getWorkspaceDirectories(sourceCache: SourceCache, cwd: string) {
  let directories = sourceCache.workspaceDirectoriesByCwd.get(cwd)
  if (!directories) {
    directories = [...discoverBuildWorkspaceDirectoriesSync(
      cwd,
      discoverManifestEntriesSync({ root: cwd })
    )]
    sourceCache.workspaceDirectoriesByCwd.set(cwd, directories)
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
  if (cwd !== root && isSameOrChildPath(cwd, filename)) return cwd
  return findNearestPackageDirectory(filename)
}

function resolveWorkspaceDirectory(
  context: RuleContext<any, any[]>,
  sourceCache: SourceCache,
  filename: string
) {
  const cwd = resolveSearchDirectory(context, filename)
  let closestDirectory: string | undefined
  for (const directory of getWorkspaceDirectories(sourceCache, cwd)) {
    if (
      isSameOrChildPath(directory, filename)
      && (!closestDirectory || directory.length > closestDirectory.length)
    ) {
      closestDirectory = directory
    }
  }
  return closestDirectory || cwd
}

function resolvePlan(workspaceDir: string, manifest?: MasterCSSManifest) {
  const result = loadProjectManifestSync({
    root: workspaceDir,
    baseManifest: manifest ?? defaultManifest
  })
  return result.entries.length ? result.manifest : manifest
}

export default function resolveContext(context: RuleContext<any, any[]>) {
  const sourceCode = context.sourceCode
  let sourceCache = sourceCaches.get(sourceCode)
  if (!sourceCache) {
    sourceCache = {
      cssCaches: [],
      references: 0,
      workspaceDirectoriesByCwd: new Map()
    }
    sourceCaches.set(sourceCode, sourceCache)
  }
  sourceCache.references++

  const resolvedSettings = Object.assign({}, settings, context.settings?.['@master/css'])
  const filename = getContextFilename(context)
  const workspaceDir = filename
    ? resolveWorkspaceDirectory(context, sourceCache, filename)
    : context.cwd || process.cwd()
  let cache = sourceCache.cssCaches.find(cache => cache.manifest === resolvedSettings.manifest &&
    cache.cwd === workspaceDir)

  if (!cache) {
    const manifest = filename
      ? resolvePlan(workspaceDir, resolvedSettings.manifest)
      : resolvedSettings.manifest
    const resolvedManifest = manifest || defaultManifest
    const tooling = createToolingSessionSync({ manifest: resolvedManifest })
    cache = {
      cwd: workspaceDir,
      manifest: resolvedSettings.manifest,
      tooling
    }
    sourceCache.cssCaches.push(cache)
  }

  let released = false

  return {
    settings: resolvedSettings,
    options: context.options[0] || {},
    tooling: cache.tooling,
    release() {
      if (released) return
      released = true
      if (--sourceCache.references !== 0) return
      for (const { tooling } of sourceCache.cssCaches) tooling.dispose()
      sourceCache.cssCaches.length = 0
      sourceCache.workspaceDirectoriesByCwd.clear()
      sourceCaches.delete(sourceCode)
    }
  }
}
