import { RuleConfig } from '../rule'

export const backgroundPosition: RuleConfig = {
    matches: '^(?:bg|background):(?:top|bottom|right|left|center|$values)(?!\\|)',
    unit: 'px'
}