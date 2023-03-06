import { RuleConfig } from '../rule'

export const textDecorationStyle: RuleConfig = {
    matches: '^t(?:ext)?:(?:solid|double|dotted|dashed|wavy|$values)(?!\\|)'
}