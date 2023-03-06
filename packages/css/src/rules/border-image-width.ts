import { RuleConfig } from '..'

export const borderImageWidth: RuleConfig = {
    matches: '^border-image:(?:\\.?[0-9]|(?:max|min|calc|clamp)\\(.*\\)|$values)[^|]*$'
}