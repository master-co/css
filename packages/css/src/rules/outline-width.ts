import { RuleConfig } from '..'

export const outlineWidth: RuleConfig = {
    matches: '^outline:(?:\\.?[0-9]|medium|thick|thin|(max|min|calc|clamp)\\(.*\\)|$values)[^|]*$'
}