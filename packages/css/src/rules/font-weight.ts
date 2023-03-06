import { RuleConfig } from '../rule'

export const fontWeight: RuleConfig = {
    matches: '^f(?:ont)?:(?:bolder|$values)(?!\\|)',
    unit: ''
}