import { type SourceRange } from '@master/css-lexer'

export interface ScanOptions {
    positionOffset?: number
}

export function containsPosition(range: SourceRange, options: ScanOptions) {
    return options.positionOffset === undefined || (range.start <= options.positionOffset && options.positionOffset <= range.end)
}
