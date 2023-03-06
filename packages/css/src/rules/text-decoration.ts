import { RuleConfig } from '..'

export const textDecoration: RuleConfig = {
    matches: '^t(?:ext)?:(?:underline|line-through|overline|$values)',
    colorful: true,
    order: -1
}