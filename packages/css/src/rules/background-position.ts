import { Rule } from '../rule'

export class BackgroundPosition extends Rule {
    static id = 'BackgroundPosition' as const
    static matches = '^(?:bg|background):(?:top|bottom|right|left|center|$values)(?!\\|)'
    static unit = 'px'
}