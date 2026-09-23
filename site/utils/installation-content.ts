import path from 'node:path'
import { extractReferenceMdx, portableMarkdown } from '../reference/markdown'
import { installationGuidesMarkdown } from './installation-guides'

export const installationGuideSlugs = ['', 'integrations', 'cli', 'cdn', 'vite', 'vite/static-rendering', 'vscode', 'react', 'react/static-rendering', 'vuejs', 'vuejs/static-rendering', 'lit', 'webpack', 'webpack/static-rendering', 'rspack', 'rspack/static-rendering', 'rsbuild', 'rsbuild/static-rendering', 'astro', 'astro/runtime-rendering', 'astro/static-rendering', 'svelte', 'express', 'express/static-rendering', 'php', 'php/static-rendering', 'rails', 'rails/static-rendering', 'laravel', 'wordpress', 'wordpress/static-rendering', 'shopify', 'aspnet-core', 'aspnet-core/static-rendering', 'blazor', 'blazor/runtime-rendering', 'blazor/static-rendering', 'storybook', 'angular', 'angular/runtime-rendering', 'angular/static-rendering', 'nextjs', 'nextjs/runtime-rendering', 'nextjs/static-rendering', 'nuxtjs', 'nuxtjs/runtime-rendering', 'nuxtjs/static-rendering', 'react-router', 'react-router/static-rendering', 'tanstack-start', 'tanstack-start/static-rendering'] as const

export async function installationGuideContent(siteRoot: string, slug: string) {
  if (!installationGuideSlugs.includes(slug as typeof installationGuideSlugs[number])) throw new Error(`Unsupported installation guide: ${slug}`)
  const route = ['', 'integrations', 'cli', 'cdn'].includes(slug) ? `(main)/${slug}` : slug
  const result = await extractReferenceMdx(path.join(siteRoot, `app/[locale]/guide/installation/${route}/content.mdx`), [], [], {
    overview: 'include',
    component(name) {
      if (name === 'InstallationGuides') return installationGuidesMarkdown()
      if (name === 'IconButtons' && slug === 'integrations') return installationGuidesMarkdown()
      if (name === 'VSCodeSvg') return ''
    }
  })
  if (result.notes.length) throw new Error(`Incomplete installation/${slug} export: ${result.notes.join('; ')}`)
  return { ...result, searchMarkdown: result.markdown, markdown: portableMarkdown(result.markdown) }
}
