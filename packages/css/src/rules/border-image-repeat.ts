import { RuleConfig } from '..'

export const borderImageRepeat: RuleConfig = {
    matches: '^border-image:(?:stretch|repeat|round|space|$values)(?!\\|)'
}