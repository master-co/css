import { pathToFileURL } from 'node:url'
import type { Plugin } from 'vite'
import { cleanId } from '../islands/vite'

const sourcePattern = /\.(?:[cm]?[jt]sx?|mdx)$/

/**
 * Server chunks only run on the machine that builds the static site. Keep each
 * module's source `import.meta.url` so site code and bundled dependencies resolve
 * repository files, data files and native bindings relative to their sources.
 */
export default function sourceURL(): Plugin {
  return {
    name: 'master-css-site:source-url',
    applyToEnvironment: (environment) => environment.config.consumer === 'server',
    transform(code, id) {
      const file = cleanId(id)
      if (id.startsWith('\0') || !file.startsWith('/') || !sourcePattern.test(file) || !code.includes('import.meta.url')) return
      return { code: code.replaceAll('import.meta.url', JSON.stringify(pathToFileURL(file).href)), map: null }
    }
  }
}
