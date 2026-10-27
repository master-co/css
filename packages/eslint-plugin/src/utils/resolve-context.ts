import type { RuleContext } from '@typescript-eslint/utils/ts-eslint'
import settings, { Settings } from '../settings'
import { MasterCSSManifest, defaultManifest } from './master-css'
import { loadProjectManifestSync } from '@master/css-compiler/project/sync'
import path from 'node:path'
import { existsSync } from 'node:fs'
import isSameOrChildPath from './is-same-or-child-path'
import type { MasterCSSToolingSession } from '@master/css-tooling'
import { createToolingSessionSync } from '@master/css-tooling/node'
import { isDependencyCurrent, stampDependency, type DependencyStamp } from './dependency-stamp'
import { acquireWorkspaceSnapshot, releaseWorkspaceSnapshot, type WorkspaceSnapshot } from './workspace-cache'
import { createSourceTooling } from './source-tooling'

declare interface CSSCache {
  cwd: string
  manifest?: MasterCSSManifest,
  tooling: MasterCSSToolingSession
  configuredManifestSignature?: string
  dependencies: readonly DependencyStamp[]
  discovery?: WorkspaceSnapshot
  references: number
  disposeTimer?: ReturnType<typeof setTimeout>
}

declare interface SourceCache {
  cssCaches: CSSCache[]
  references: number
  workspaces: Map<string, WorkspaceSnapshot>
  tooling: {
    cwd: string
    filename?: string
    manifest?: MasterCSSManifest
    session: MasterCSSToolingSession
    clear(): void
  }[]
}

const sourceCaches = new WeakMap<object, SourceCache>()
const cssCaches: CSSCache[] = []
const CACHE_IDLE_DISPOSE_DELAY = 1_000

function disposeCSSCache(cache: CSSCache) {
  if (cache.disposeTimer) clearTimeout(cache.disposeTimer)
  cache.disposeTimer = undefined
  cache.tooling.dispose()
  const index = cssCaches.indexOf(cache)
  if (index !== -1) cssCaches.splice(index, 1)
}

function scheduleCSSCacheDisposal(cache: CSSCache) {
  if (cache.references || cache.disposeTimer) return
  cache.disposeTimer = setTimeout(() => {
    cache.disposeTimer = undefined
    if (!cache.references) disposeCSSCache(cache)
  }, CACHE_IDLE_DISPOSE_DELAY)
  cache.disposeTimer.unref?.()
}

function retainCSSCache(cache: CSSCache) {
  if (cache.disposeTimer) clearTimeout(cache.disposeTimer)
  cache.disposeTimer = undefined
  cache.references++
}

function getContextFilename(context: RuleContext<any, any[]>) {
  const filename = context.physicalFilename || context.filename
  if (!filename || filename.startsWith('<')) return
  return path.isAbsolute(filename) ? filename : path.resolve(context.cwd, filename)
}

function getWorkspaceSnapshot(sourceCache: SourceCache, cwd: string) {
  let snapshot = sourceCache.workspaces.get(cwd)
  if (!snapshot) {
    snapshot = acquireWorkspaceSnapshot(cwd)
    sourceCache.workspaces.set(cwd, snapshot)
  }
  return snapshot
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
  const discovery = getWorkspaceSnapshot(sourceCache, cwd)
  let closestDirectory: string | undefined
  for (const directory of discovery.directories) {
    if (
      isSameOrChildPath(directory, filename)
      && (!closestDirectory || directory.length > closestDirectory.length)
    ) {
      closestDirectory = directory
    }
  }
  return { workspaceDir: closestDirectory || cwd, discovery }
}

function resolvePlan(workspaceDir: string, manifest?: MasterCSSManifest) {
  const result = loadProjectManifestSync({
    root: workspaceDir,
    baseManifest: manifest ?? defaultManifest
  })
  return {
    manifest: result.entries.length ? result.manifest : manifest,
    dependencies: result.dependencies
  }
}

function resolveTooling(context: RuleContext<any, any[]>, sourceCache: SourceCache, resolvedSettings: Settings) {
  const filename = getContextFilename(context)
  const { workspaceDir, discovery } = filename
    ? resolveWorkspaceDirectory(context, sourceCache, filename)
    : { workspaceDir: context.cwd || process.cwd(), discovery: undefined }
  const configuredManifestSignature = resolvedSettings.manifest
    ? JSON.stringify(resolvedSettings.manifest)
    : undefined
  let cache = sourceCache.cssCaches.find(cache => cache.manifest === resolvedSettings.manifest &&
    cache.cwd === workspaceDir)

  if (!cache) {
    cache = cssCaches.find(cache => cache.manifest === resolvedSettings.manifest &&
      cache.cwd === workspaceDir)
    if (cache && (
      cache.configuredManifestSignature !== configuredManifestSignature
      || cache.discovery !== discovery
      || !cache.dependencies.every(isDependencyCurrent)
    )) {
      if (cache.references) {
        cssCaches.splice(cssCaches.indexOf(cache), 1)
        scheduleCSSCacheDisposal(cache)
      } else {
        disposeCSSCache(cache)
      }
      cache = undefined
    }
  }

  if (!cache) {
    const plan = filename
      ? resolvePlan(workspaceDir, resolvedSettings.manifest)
      : { manifest: resolvedSettings.manifest, dependencies: [] }
    const resolvedManifest = plan.manifest || defaultManifest
    const tooling = createToolingSessionSync({ manifest: resolvedManifest })
    cache = {
      cwd: workspaceDir,
      manifest: resolvedSettings.manifest,
      tooling,
      configuredManifestSignature,
      dependencies: plan.dependencies.map(stampDependency),
      discovery,
      references: 0
    }
    cssCaches.push(cache)
  }
  if (!sourceCache.cssCaches.includes(cache)) {
    retainCSSCache(cache)
    sourceCache.cssCaches.push(cache)
  }
  return cache.tooling
}

export default function resolveContext(context: RuleContext<any, any[]>) {
  const sourceCode = context.sourceCode
  let sourceCache = sourceCaches.get(sourceCode)
  if (!sourceCache) {
    sourceCache = { cssCaches: [], references: 0, workspaces: new Map(), tooling: [] }
    sourceCaches.set(sourceCode, sourceCache)
  }
  sourceCache.references++
  const resolvedSettings = Object.assign({}, settings, context.settings?.['@master/css'])
  const cwd = context.cwd || process.cwd()
  const filename = getContextFilename(context)
  let facade = sourceCache.tooling.find(item => item.cwd === cwd && item.filename === filename
    && item.manifest === resolvedSettings.manifest)
  if (!facade) {
    let session: MasterCSSToolingSession | undefined
    const source = sourceCache
    facade = {
      cwd, filename, manifest: resolvedSettings.manifest,
      ...createSourceTooling(() => {
        if (!source.references) throw new Error('The ESLint source context has been released.')
        return session ??= resolveTooling(context, source, resolvedSettings)
      })
    }
    sourceCache.tooling.push(facade)
  }

  let released = false

  return {
    settings: resolvedSettings,
    options: context.options[0] || {},
    tooling: facade.session,
    release() {
      if (released) return
      released = true
      if (--sourceCache.references !== 0) return
      for (const cache of sourceCache.cssCaches) {
        cache.references--
        scheduleCSSCacheDisposal(cache)
      }
      for (const snapshot of sourceCache.workspaces.values()) releaseWorkspaceSnapshot(snapshot)
      for (const facade of sourceCache.tooling) facade.clear()
      sourceCache.cssCaches.length = 0
      sourceCache.workspaces.clear()
      sourceCache.tooling.length = 0
      sourceCaches.delete(sourceCode)
    }
  }
}
