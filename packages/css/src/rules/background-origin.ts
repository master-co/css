import { RuleConfig } from '../rule'

export const backgroundOrigin: RuleConfig = {
    matches: '^(?:bg|background):(?:$values)(?!\\|)'
}