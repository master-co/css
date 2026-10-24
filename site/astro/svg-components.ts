import { readFile } from 'node:fs/promises'
import { transform } from '@svgr/core'
import svgrJSX from '@svgr/plugin-jsx'
import svgrSVGO from '@svgr/plugin-svgo'
import { transformWithOxc, type Plugin } from 'vite'
import svgoConfig from '../docs-shell/common/svgo.config.js'

const prefix = '\0site-svg:'
// The suffix keeps Astro's image plugin from treating the component module as an asset.
const suffix = '.component.js'
const scriptImporter = /\.(?:[cm]?[jt]sx?|mdx)(?:$|\?)/

/** Import SVG files from scripts and MDX as React components. */
export default function svgComponents(): Plugin {
  return {
    name: 'master-css-site:svg-components',
    enforce: 'pre',
    async resolveId(source, importer, options) {
      if (!source.endsWith('.svg') || !importer || !scriptImporter.test(importer)) return
      const resolved = await this.resolve(source, importer, { ...options, skipSelf: true })
      if (resolved && !resolved.external && resolved.id.endsWith('.svg')) return prefix + resolved.id + suffix
    },
    async load(id) {
      if (!id.startsWith(prefix)) return
      const file = id.slice(prefix.length, -suffix.length)
      this.addWatchFile(file)
      const jsx = await transform(await readFile(file, 'utf8'), {
        plugins: [svgrSVGO, svgrJSX],
        svgo: true,
        svgoConfig: svgoConfig as NonNullable<Parameters<typeof transform>[1]>['svgoConfig'],
        jsxRuntime: 'automatic'
      }, { filePath: file, componentName: 'SvgComponent' })
      const { code, map } = await transformWithOxc(jsx, `${file}.jsx`, { jsx: { runtime: 'automatic' } })
      return { code, map }
    }
  }
}
