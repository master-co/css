import type { Plugin } from 'vite'
import { isFileLoadingAllowed, normalizePath } from 'vite'
import MagicString from 'magic-string'
import type { MasterCSSVitePluginContext } from '../core'
import { clearDevStylesheets, devStylesheetState } from '../utils/dev-stylesheet-delivery'
import { releaseScannerEnvironment } from '../utils/scanner-context'
import { toAssetHref } from '../utils/html'

export default function DevStylesheetPlugin(context: MasterCSSVitePluginContext): Plugin {
  return {
    name: 'master-css:dev-stylesheet',
    apply: 'serve',
    enforce: 'post',
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const state = devStylesheetState(context)
        const url = new URL(request.url ?? '/', 'http://localhost')
        if (!url.pathname.startsWith(state.prefix)) return next()
        const css = state.stylesheets.get(url.pathname)
        if (css !== undefined) {
          response.setHeader('Content-Type', 'text/css')
          response.setHeader('Cache-Control', 'no-store')
          response.end(css)
          return
        }
        const resource = state.resources.get(url.pathname)
        if (resource) {
          if (!server.config.server.fs.allow.includes(resource.source)) server.config.server.fs.allow.push(resource.source)
          if (!isFileLoadingAllowed(server.config, normalizePath(resource.source))) {
            response.statusCode = 403
            response.end('Development resource access denied')
            return
          }
          const file = resource.file
          if (!server.config.server.fs.allow.includes(file)) server.config.server.fs.allow.push(file)
          const encodedPath = normalizePath(file).split('/').map(encodeURIComponent).join('/').replace(/^\//, '')
          request.url = toAssetHref('@fs/' + encodedPath, server.config.base) + url.search
          next()
          return
        }
        response.statusCode = 404
        response.end('Unknown development stylesheet asset')
      })
    },
    transform(code) {
      const { origin } = devStylesheetState(context)
      if (!code.includes(origin)) return
      const output = new MagicString(code)
      for (const match of code.matchAll(new RegExp(origin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'))) output.remove(match.index!, match.index! + origin.length)
      return { code: output.toString(), map: output.generateMap({ hires: true }) }
    },
    closeBundle() {
      const config = this.environment?.getTopLevelConfig() ?? context.config
      if (releaseScannerEnvironment(context, config, this.environment)) clearDevStylesheets(context)
    }
  }
}
