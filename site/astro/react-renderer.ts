import React, { createElement as h } from 'react'
import reactRenderer from '@astrojs/react/server.js'
import type { AstroComponentMetadata, NamedSSRLoadedRendererValue, SSRResult } from 'astro'
import { SiteRoot } from '../docs-shell/layouts/root'
import { siteContextOf } from './site-context'

type RenderContext = { result: SSRResult }

async function check(Component: any) {
  if (typeof Component === 'object') return String(Component?.$$typeof ?? '').startsWith('Symbol(react')
  if (typeof Component !== 'function' || Component.isAstroComponentFactory) return false
  // Async server components return promises, so detect them by shape rather than by calling them.
  return !Component.prototype?.render || React.Component.isPrototypeOf(Component)
}

/**
 * Every React root Astro renders receives the site providers. Interactive React
 * code hydrates through `'use client'` islands, not Astro client directives.
 */
async function renderToStaticMarkup(this: RenderContext, Component: any, props: Record<string, any>, slots: Record<string, any>, metadata?: AstroComponentMetadata) {
  if (metadata?.hydrate) {
    throw new Error(`Do not hydrate ${metadata.displayName ?? 'React components'} with Astro client directives; mark the module with 'use client' instead.`)
  }
  const site = siteContextOf(new URL(this.result.request.url))
  function SiteComponent(componentProps: Record<string, any>) {
    return h(SiteRoot, site, h(Component, componentProps))
  }
  const rendered = await reactRenderer.renderToStaticMarkup.call(this, SiteComponent, props, slots, metadata)
  return { ...rendered, html: rendered.html.replace(/<\/?astro-static-slot>/g, '') }
}

const renderer: NamedSSRLoadedRendererValue = {
  name: 'master-css-site:react',
  check,
  renderToStaticMarkup,
  supportsAstroStaticSlot: true
}

export default renderer
