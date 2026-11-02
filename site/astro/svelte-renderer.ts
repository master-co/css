import { createRawSnippet } from 'svelte'
import { render } from 'svelte/server'
import svelteRenderer from '@astrojs/svelte/server.js'
import type { AstroComponentMetadata, NamedSSRLoadedRendererValue, SSRResult } from 'astro'
import { siteContextKey } from '../docs-shell/site'
import { siteContextOf } from './site-context'

type RenderContext = { result: SSRResult }

const ids = new WeakMap<SSRResult, number>()

function escapeSlotName(name: string) {
  return name.replace(/[&"<>]/g, (character) => `&#${character.charCodeAt(0)};`)
}

/**
 * `@astrojs/svelte` rendering with the page's site context, so every Svelte root can call
 * `getSite()`. Astro slots arrive as snippets: the default slot as `children`, named slots by name.
 */
async function renderToStaticMarkup(this: RenderContext, Component: any, props: Record<string, any>, slotted: Record<string, string>, metadata?: AstroComponentMetadata) {
  const tagName = metadata?.hydrate ? 'astro-slot' : 'astro-static-slot'
  const snippets: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(slotted)) {
    const name = key === 'default' ? '' : ` name="${escapeSlotName(key)}"`
    snippets[key === 'default' ? 'children' : key] = createRawSnippet(() => ({ render: () => `<${tagName}${name}>${value}</${tagName}>` }))
  }
  const index = ids.get(this.result) ?? 0
  ids.set(this.result, index + 1)
  const result = await render(Component, {
    props: { ...props, ...snippets },
    context: new Map([[siteContextKey, siteContextOf(new URL(this.result.request.url))]]),
    idPrefix: `s${index}`
  })
  // Svelte renders nullish class values as empty attributes.
  return { html: result.body.replace(/\s+class=""/g, '') }
}

const renderer: NamedSSRLoadedRendererValue = {
  name: 'master-css-site:svelte',
  check: svelteRenderer.check,
  renderToStaticMarkup,
  supportsAstroStaticSlot: true
}

export default renderer
