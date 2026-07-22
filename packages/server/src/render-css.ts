import parseHTML from './parse-html'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import getDefaultManifest from './default-manifest'
import createServerCSS, { type ServerCSS } from './create-server-css'

/**
 * Renders the Master CSS string from HTML
 * @param html
 * @param manifest
 * @returns MasterCSS
 */
export default function renderCSS(html: string, manifest?: MasterCSSManifest): ServerCSS | undefined {
  if (!html) return
  const { classes } = parseHTML(html)
  if (!classes.length) return
  const css = createServerCSS(manifest || getDefaultManifest())
  css.ensureClassRules(...classes)
  return css
}
