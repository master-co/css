import path from 'node:path'
import { extractReferenceMdx, portableMarkdown } from '../reference/markdown'
import { installationGuidesMarkdown } from './installation-guides'

export const installationGuideSlugs = [
  '', 'integrations', 'cli', 'cdn',
  'vite', 'vite/runtime', 'vscode',
  'react', 'react/runtime', 'vuejs', 'vuejs/runtime', 'lit',
  'webpack', 'webpack/runtime', 'rspack', 'rspack/runtime', 'rsbuild', 'rsbuild/runtime',
  'astro', 'astro/runtime', 'astro/progressive', 'svelte',
  'express', 'express/progressive', 'php', 'php/runtime', 'rails', 'rails/runtime',
  'laravel', 'wordpress', 'wordpress/runtime', 'shopify',
  'aspnet-core', 'aspnet-core/runtime', 'blazor', 'blazor/runtime',
  'storybook', 'angular', 'angular/runtime',
  'nextjs', 'nextjs/runtime', 'nextjs/progressive',
  'nuxtjs', 'nuxtjs/runtime', 'nuxtjs/progressive',
  'react-router', 'react-router/runtime', 'tanstack-start', 'tanstack-start/runtime'
] as const

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
