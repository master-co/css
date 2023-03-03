import { Rule } from '../'

export class ShapeOutside extends Rule {
    static override id = 'ShapeOutside' as const
    static override matches = '^shape:(?:(?:inset|circle|ellipse|polygon|url|linear-gradient)\\(.*\\)|$values)(?!\\|)'
}