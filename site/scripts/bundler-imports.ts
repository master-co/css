import { readFileSync } from 'node:fs'
import { registerHooks } from 'node:module'
import { fileURLToPath } from 'node:url'

const image = /\.(?:avif|gif|jpe?g|png|webp)$/

// Content generation evaluates presentation modules without the Astro/Vite bundler.
registerHooks({
  resolve(specifier, context, nextResolve) {
    const query = specifier.match(/\?raw$/)?.[0]
    if (!query) return nextResolve(specifier, context)
    const resolved = nextResolve(specifier.slice(0, -query.length), context)
    return { ...resolved, url: resolved.url + query, format: 'module' }
  },
  load(url, context, nextLoad) {
    const { pathname, search } = new URL(url)
    if (search === '?raw') {
      return { format: 'module', source: `export default ${JSON.stringify(readFileSync(fileURLToPath(url.slice(0, -search.length)), 'utf8'))}`, shortCircuit: true }
    }
    if (pathname.endsWith('.css')) return { format: 'module', source: '', shortCircuit: true }
    if (pathname.endsWith('.svg')) return { format: 'module', source: 'export default function SvgComponent() { return null }', shortCircuit: true }
    if (image.test(pathname)) return { format: 'module', source: `export default ${JSON.stringify({ src: pathname, width: 1, height: 1 })}`, shortCircuit: true }
    return nextLoad(url, context)
  }
})
