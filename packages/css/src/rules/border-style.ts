import { Rule } from '../rule'
import { getBorderProps } from '../utils/get-border-props'

import { RuleConfig } from '../rule'

export const borderStyle: RuleConfig = {
    matches: '^(?:border(?:-(?:left|right|top|bottom))?-style:.|b(?:[xytblr]|order(?:-(?:left|right|top|bottom))?)?:(?:none|hidden|dotted|dashed|solid|double|groove|ridge|inset|outset|$values)(?!\\|))',
    prop: false,
    get(declaration): { [key: string]: any } {
        return getBorderProps(this.prefix, declaration, 'style')
    },
    get order(): number {
        return (this.prefix === 'border-style' + ':' || this.prefix === 'b:' || this.prefix === 'border' + ':') ? -1 : 0
    }
}