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
    directories = [...discoverBuildWorkspaceDirectoriesSync(
      cwd,
      discoverManifestEntriesSync({ root: cwd })
    )]
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
  if (cwd !== root && isSameOrChildPath(cwd, filename)) return cwd
  return findNearestPackageDirectory(filename)
}

function resolveWorkspaceDirectory(context: RuleContext<any, any[]>, filename: string) {
  const cwd = resolveSearchDirectory(context, filename)
  let closestDirectory: string | undefined
  for (const directory of getWorkspaceDirectories(cwd)) {
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
  const resolvedSettings = Object.assign({}, settings, context.settings?.['@master/css'])
  const filename = getContextFilename(context)
  const workspaceDir = filename ? resolveWorkspaceDirectory(context, filename) : context.cwd || process.cwd()
  let cache = cssCaches.find(cache => cache.manifest === resolvedSettings.manifest &&
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
    cssCaches.push(cache)
  }

  return {
    settings: resolvedSettings,
    options: context.options[0] || {},
    tooling: cache.tooling
  }
}
