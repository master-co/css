import { RuleConfig } from '..'

export const textDecorationThickness: RuleConfig = {
    matches: '^text-decoration:(?:\\.?[0-9]|(?:max|min|calc|clamp)\\(.*\\)|from-font|$values)[^|]*$',
    unit: 'em'
}