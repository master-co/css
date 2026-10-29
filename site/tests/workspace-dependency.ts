import { existsSync, realpathSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join } from 'node:path'

/** Resolve installed fixture packages through their owner, independent of store layout. */
export function workspaceDependency(name: string, owner = new URL('../../package.json', import.meta.url)) {
  for (const directory of createRequire(owner).resolve.paths(name) ?? []) {
    const root = join(directory, name)
    if (existsSync(join(root, 'package.json'))) return realpathSync(root)
  }
  throw new Error(`Missing installed fixture dependency: ${name} (owner: ${owner})`)
}
