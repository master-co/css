import { createServerRenderer, type MasterCSSServerRendererOptions } from './create-server-renderer'
import {
  bindHTMLRenderSessionInternal,
  type MasterCSSHTMLRenderSession
} from './html-render-session'
import type { MasterCSSHTMLDocumentOptions, MasterCSSHTMLRenderResult } from './render'

export interface MasterCSSHTMLRenderOptions
  extends MasterCSSServerRendererOptions, MasterCSSHTMLDocumentOptions { }

export function renderHTML(
  html: string,
  options: MasterCSSHTMLRenderOptions
): MasterCSSHTMLRenderResult {
  const {
    hydrationManifest,
    stylesheets,
    documentURL,
    stylesheetImportSource,
    manifest,
    emittedGlobals,
    maxCachedClasses
  } = options
  const renderer = createServerRenderer({ manifest, emittedGlobals, maxCachedClasses })
  try {
    return renderer.renderHTML(html, { hydrationManifest, stylesheets, documentURL, stylesheetImportSource })
  } finally {
    renderer.dispose()
  }
}

export function createHTMLRenderSession(
  options: MasterCSSHTMLRenderOptions
): MasterCSSHTMLRenderSession {
  const {
    hydrationManifest,
    stylesheets,
    documentURL,
    stylesheetImportSource,
    manifest,
    emittedGlobals,
    maxCachedClasses
  } = options
  const renderer = createServerRenderer({ manifest, emittedGlobals, maxCachedClasses })
  return bindHTMLRenderSessionInternal(renderer, { hydrationManifest, stylesheets, documentURL, stylesheetImportSource }, true)
}
