import { RuleConfig } from '..'

export const strokeWidth: RuleConfig = {
    matches: '^stroke:(?:\\.?[0-9]|(?:max|min|calc|clamp)\\(.*\\)|$values)[^|]*$'
}