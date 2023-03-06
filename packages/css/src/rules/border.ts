import { Rule } from '../rule'
import { getBorderProps } from '../utils/get-border-props'

import { RuleConfig } from '..'

export const border: RuleConfig = {
    matches: '^b(?:[xytblr]?|order(?:-(?:left|right|top|bottom))?):.',
    colorful: true,
    prop: false,
    get(declaration): { [key: string]: any } {
        return getBorderProps(this.prefix, declaration)
    },
    get order(): number {
        return (this.prefix === 'border' + ':' || this.prefix === 'b:') ? -2 : -1
    }
}