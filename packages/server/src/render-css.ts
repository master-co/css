import parseHTML from './parse-html'
import { MasterCSS } from '@master/css'
import type { MasterCSSManifest } from 'shared/master-css-manifest'
import getDefaultManifest from './default-manifest'
import createServerCSS from './create-server-css'

/**
 * Renders the Master CSS string from HTML
 * @param html
 * @param manifest
 * @returns MasterCSS
 */
export default function renderCSS(html: string, manifest?: MasterCSSManifest): MasterCSS | undefined {
    if (!html) return
    const { classes } = parseHTML(html)
    if (!classes.length) return
    const css = createServerCSS(manifest || getDefaultManifest())
    classes.forEach(eachClass => css.add(eachClass))
    return css
}
