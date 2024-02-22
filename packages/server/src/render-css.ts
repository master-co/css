import parseHTML from './parse-html'
import { MasterCSS, Config } from '@master/css'

/**
 * Renders the Master CSS string from HTML
 * @param html
 * @param config
 * @returns MasterCSS
 */
export default function renderCSS(html: string, config?: Config): MasterCSS | undefined {
    if (!html) return
    const { classes } = parseHTML(html)
    if (!classes.length) return
    const css = new MasterCSS(config)
    classes.forEach(eachClass => css.add(eachClass))
    return css
}