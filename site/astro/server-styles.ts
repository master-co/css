import { isCSSRequest, type Plugin } from 'vite'
import { cleanId } from '../islands/vite'

const siteRoot = new URL('..', import.meta.url).pathname
const empty = '\0site-server-style'

/**
 * Pages link the stylesheets of every module they render on the server. Island
 * modules repeat those imports in the browser bundle, where Astro would attach
 * them to every page of the route, so the client build omits site stylesheets.
 * Development keeps them for Vite's CSS hot updates.
 */
export default function serverStyles(): Plugin {
  return {
    name: 'master-css-site:server-styles',
    enforce: 'pre',
    apply: 'build',
    applyToEnvironment: (environment) => environment.config.consumer === 'client',
    resolveId(source, importer) {
      if (!importer || importer.startsWith('\0') || !cleanId(importer).startsWith(siteRoot) || isCSSRequest(cleanId(importer))) return
      if (isCSSRequest(source) && !/[?&](?:inline|raw|url)\b/.test(source)) return empty
    },
    load(id) {
      if (id === empty) return 'export default undefined'
    }
  }
}
