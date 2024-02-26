export interface SyntaxError {
    class?: string
    name?: string
    message?: string
    stack?: string
    rawMessage?: string
    syntax?: string
    css?: string
    mismatchOffset?: number
    mismatchLength?: number
    offset?: number
    line?: number
    column?: number
    loc?: { source?: string, start: any, end: any }
    property?: string
    details?: string
}