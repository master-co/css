import { Rule } from '../rule'

export class BackgroundRepeat extends Rule {
    static id = 'BackgroundRepeat' as const
    static matches = '^(?:bg|background):(?:space|round|repeat|no-repeat|repeat-x|repeat-y|$values)(?![|a-zA-Z])'
}