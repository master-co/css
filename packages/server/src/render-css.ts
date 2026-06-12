import parseHTML from './parse-html'
import { MasterCSS, createCSS, defaultPlan } from '@master/css'
import type { MasterCSSPlan } from 'shared/master-css-plan'

/**
 * Renders the Master CSS string from HTML
 * @param html
 * @param plan
 * @returns MasterCSS
 */
export default function renderCSS(html: string, plan: MasterCSSPlan = defaultPlan): MasterCSS | undefined {
    if (!html) return
    const { classes } = parseHTML(html)
    if (!classes.length) return
    const css = createCSS(plan)
    classes.forEach(eachClass => css.add(eachClass))
    return css
}
