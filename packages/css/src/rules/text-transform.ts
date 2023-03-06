import { RuleConfig } from '..'

export const textTransform: RuleConfig = {
    matches: '^t(?:ext)?:(?:uppercase|lowercase|capitalize|$values)(?!\\|)'
}