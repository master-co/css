import { RuleConfig } from '../rule'

export const shapeMargin: RuleConfig = {
    matches: '^shape:(?:\\.?[0-9]|(?:max|min|calc|clamp)\\(.*\\)|$values)[^|]*$'
}