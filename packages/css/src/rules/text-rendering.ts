import { Rule } from '../'

export class TextRendering extends Rule {
    static override id = 'TextRendering' as const
    static override matches = '^t(?:ext)?:(?:optimizeSpeed|optimizeLegibility|geometricPrecision|$values)(?!\\|)'
}