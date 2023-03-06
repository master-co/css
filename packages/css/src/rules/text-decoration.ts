import { RuleConfig } from '../rule'

export const textDecoration: RuleConfig = {
    matches: '^t(?:ext)?:(?:underline|line-through|overline|$values)',
    colorful: true,
    order: -1
}