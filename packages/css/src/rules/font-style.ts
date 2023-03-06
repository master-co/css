import { RuleConfig } from '..'

export const fontStyle: RuleConfig = {
    matches: '^f(?:ont)?:(?:normal|italic|oblique|$values)(?!\\|)',
    unit: 'deg'
}