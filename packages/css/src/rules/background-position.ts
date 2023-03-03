import { Rule } from '../'

export default class extends Rule {
    static override id = 'BackgroundPosition' as const
    static override matches = '^(?:bg|background):(?:top|bottom|right|left|center|$values)(?!\\|)'
    static override unit = 'px'
}