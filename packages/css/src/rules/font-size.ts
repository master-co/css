import { RuleConfig } from '..'

export const fontSize: RuleConfig = {
    matches: '^f(?:ont)?:(?:[0-9]|(?:max|min|calc|clamp)\\(.*\\)|$values)[^|]*$'
}