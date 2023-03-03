import { Rule } from '../'

export class BackgroundRepeat extends Rule {
    static override id = 'BackgroundRepeat' as const
    static override matches = '^(?:bg|background):(?:space|round|repeat|no-repeat|repeat-x|repeat-y|$values)(?![|a-zA-Z])'
}