import type { MasterCSSServerStylesheet } from '@master/css-server'

const PRERENDER_STYLESHEETS = Symbol.for('@master/css-astro:prerender-stylesheets')

export interface PrerenderStylesheets {
  /** Final stylesheets in the client output. */
  stylesheets(): Promise<readonly MasterCSSServerStylesheet[]>
  /** Publish CSS the renderer imports from a stylesheet, returning its URL. */
  publishImport(css: string): string
}

/**
 * Astro prerenders after it moves the final CSS into the client output, inside
 * the building process. The integration lends the middleware those stylesheets
 * there, keeping the compiler and filesystem out of server bundles; deployed
 * server routes render without them.
 */
export function providePrerenderStylesheets(provider: PrerenderStylesheets | undefined) {
  (globalThis as Record<symbol, unknown>)[PRERENDER_STYLESHEETS] = provider
}

export function prerenderStylesheets() {
  return (globalThis as Record<symbol, unknown>)[PRERENDER_STYLESHEETS] as PrerenderStylesheets | undefined
}
