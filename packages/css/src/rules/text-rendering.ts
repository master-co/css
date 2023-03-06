import { Rule } from '../rule'

export class TextRendering extends Rule {
    static id = 'TextRendering' as const
    static matches = '^t(?:ext)?:(?:optimizeSpeed|optimizeLegibility|geometricPrecision|$values)(?!\\|)'
}