import { RuleConfig } from '../rule'

export const borderImageRepeat: RuleConfig = {
    matches: '^border-image:(?:stretch|repeat|round|space|$values)(?!\\|)'
}