import type { AstroIntegration } from 'astro'
import mdx from '@mdx-js/rollup'
import remarkGfm from 'remark-gfm'
import { fileURLToPath } from 'node:url'
import siteIslands from '../islands/vite'
import svgComponents from './svg-components'
import sourceURL from './source-url'
import serverStyles from './server-styles'
import remarkSlugAndTOC from '../docs-shell/remark/slug-and-toc.js'
import remarkCodeMeta from '../docs-shell/remark/code-meta.js'

/** Site build conventions: React-compiled MDX, SVG components, and `'use client'` islands. */
export default function siteIntegration(): AstroIntegration {
  return {
    name: 'master-css-site',
    hooks: {
      'astro:config:setup': ({ addRenderer, updateConfig, command }) => {
        addRenderer({
          name: 'master-css-site:react',
          serverEntrypoint: fileURLToPath(new URL('./react-renderer.ts', import.meta.url))
        })
        const plugins: unknown[] = [
          {
            enforce: 'pre',
            ...mdx({
              jsxImportSource: 'react',
              providerImportSource: fileURLToPath(new URL('../docs-shell/components/mdx-provider.tsx', import.meta.url)),
              development: command === 'dev',
              remarkPlugins: [remarkSlugAndTOC, remarkGfm, remarkCodeMeta]
            })
          },
          svgComponents(),
          sourceURL(),
          serverStyles(),
          siteIslands()
        ]
        updateConfig({ vite: { plugins: plugins as never } })
      }
    }
  }
}
