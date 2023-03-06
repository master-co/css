import { RuleConfig } from '../rule'

export const transformOrigin: RuleConfig = {
    matches: '^transform:(?:top|bottom|right|left|center|[0-9]|$values)',
    unit: 'px'
}