import { isFileLoadingAllowed, normalizePath, type ViteDevServer } from 'vite'
import { getSassSourceFile } from './build-sass-source'

/** Apply the host file policy to the real owner before loading a virtual proxy. */
export function installSassProxyAccessCheck(server: ViteDevServer) {
  server.middlewares.use((request, response, next) => {
    const check = async () => {
      if (!request.url) return next()
      const url = new URL(request.url, 'http://master-css.invalid')
      let path = decodeURI(url.pathname)
      const base = server.config.base
      if (base !== '/' && path.startsWith(base)) path = '/' + path.slice(base.length)
      const id = (path.startsWith('/@id/') ? path.slice(5).replace('__x00__', '\0') : path) + url.search
      if (!getSassSourceFile(id)) return next()
      const resolved = await server.environments.client.pluginContainer.resolveId(id)
      const owner = resolved && getSassSourceFile(resolved.id)
      if (owner && !isFileLoadingAllowed(server.config, normalizePath(owner))) {
        response.statusCode = 403
        response.setHeader('Content-Type', 'text/plain; charset=utf-8')
        response.end('403 Restricted')
        return
      }
      next()
    }
    void check().catch(next)
  })
}
