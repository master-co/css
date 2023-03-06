import { RuleConfig } from '../rule'

export const backgroundRepeat: RuleConfig = {
    matches: '^(?:bg|background):(?:space|round|repeat|no-repeat|repeat-x|repeat-y|$values)(?![|a-zA-Z])'
}