import { isAbsolute } from 'node:path'
import { pathToFileURL } from 'node:url'

/** Host maps may contain native filesystem paths as well as URL references. */
export function sourceMapURL(source: string, base: URL): URL {
  return isAbsolute(source) ? pathToFileURL(source) : new URL(source, base)
}

export function sourceMapBase(owner: string, sourceRoot?: string): URL {
  return sourceMapURL(sourceRoot ? sourceRoot.replace(/\/?$/, '/') : './', pathToFileURL(owner))
}
