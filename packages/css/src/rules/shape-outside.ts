import { Rule } from '../rule'

export class ShapeOutside extends Rule {
    static id = 'ShapeOutside' as const
    static matches = '^shape:(?:(?:inset|circle|ellipse|polygon|url|linear-gradient)\\(.*\\)|$values)(?!\\|)'
}