import { RuleConfig } from '..'

export const outlineStyle: RuleConfig = {
    matches: '^outline:(?:none|dotted|dashed|solid|double|groove|ridge|inset|outset|$values)(?!\\|)'
}