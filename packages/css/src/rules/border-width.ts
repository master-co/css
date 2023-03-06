import { Rule } from '../rule'
import { getBorderProps } from '../utils/get-border-props'

import { RuleConfig } from '../rule'

export const borderWidth: RuleConfig = {
    matches: '^(?:border(?:-(?:left|right|top|bottom))?-width:.|b(?:[xytblr]|order(?:-(?:left|right|top|bottom))?)?:(?:\\.?[0-9]|(?:max|min|calc|clamp)\\(.*\\)|$values)[^|]*$)',
    prop: false,
    get(declaration): { [key: string]: any } {
        return getBorderProps(this.prefix, declaration, 'width')
    },
    get order(): number {
        return (this.prefix === 'border-width' + ':' || this.prefix === 'b:' || this.prefix === 'border' + ':') ? -1 : 0
    }
}