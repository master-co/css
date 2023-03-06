import { RuleConfig } from '../rule'

export const fontStyle: RuleConfig = {
    matches: '^f(?:ont)?:(?:normal|italic|oblique|$values)(?!\\|)',
    unit: 'deg'
}