import { RuleConfig } from '../rule'

export const outlineWidth: RuleConfig = {
    matches: '^outline:(?:\\.?[0-9]|medium|thick|thin|(max|min|calc|clamp)\\(.*\\)|$values)[^|]*$'
}