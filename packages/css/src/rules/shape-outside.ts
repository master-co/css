import { RuleConfig } from '../rule'

export const shapeOutside: RuleConfig = {
    matches: '^shape:(?:(?:inset|circle|ellipse|polygon|url|linear-gradient)\\(.*\\)|$values)(?!\\|)'
}