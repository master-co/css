import { readFile } from 'node:fs/promises'
import { optimize, type Config } from 'svgo'
import type { Plugin } from 'vite'
import svgoConfig from '../docs-shell/common/svgo.config.js'
import { cleanId } from './module-id'

/**
 * `.svg?raw` imports give Svelte components inline SVG markup. Optimize it like Astro's SVG
 * components, with the same configuration, so both render the same markup and file-prefixed ids.
 */
export default function svgMarkup(): Plugin {
  return {
    name: 'master-css-site:svg-markup',
    enforce: 'pre',
    async load(id) {
      if (!/\.svg\?raw$/.test(id)) return
      const file = cleanId(id)
      this.addWatchFile(file)
      const { data } = optimize(await readFile(file, 'utf8'), { ...(svgoConfig as Config), path: file })
      return `export default ${JSON.stringify(data)}`
    }
  }
}
