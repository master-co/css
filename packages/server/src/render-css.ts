import parseHTML from './parse-html'
import { MasterCSS, createCSS } from '@master/css'
import type { MasterCSSPlan } from 'shared/master-css-plan'
import getDefaultPlan from './default-plan'

/**
 * Renders the Master CSS string from HTML
 * @param html
 * @param plan
 * @returns MasterCSS
 */
export default function renderCSS(html: string, plan?: MasterCSSPlan): MasterCSS | undefined {
    if (!html) return
    const { classes } = parseHTML(html)
    if (!classes.length) return
    const css = createCSS(plan || getDefaultPlan())
    classes.forEach(eachClass => css.add(eachClass))
    return css
}
