import type { Config } from '../config'
import type { Rule } from '../rule'
import { extractClassesFromHTML } from './extract-classes-from-html'
import { renderRules } from './render-rules'

export function renderRulesFromHTML(html: string, config?: Config): Rule[] {
    if (!html) return
    const classes = extractClassesFromHTML(html)
    if (!classes.length) return
    return renderRules(classes, config)
}