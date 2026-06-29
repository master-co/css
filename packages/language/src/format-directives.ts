import {
    collectCSSDirectiveRanges,
    collectCSSQuotedStringRanges,
    type CSSDirectiveRuleRange,
    type SourceRange
} from '@master/css-lexer'

export interface MasterCSSDirectiveFormatEdit {
    start: number
    end: number
    newText: string
}

export interface FormatMasterCSSDirectivesOptions {
    range?: SourceRange
}

function rangesEqual(a: SourceRange, b: SourceRange) {
    return a.start === b.start && a.end === b.end
}

function isWithinRange(range: SourceRange, parent?: SourceRange) {
    return !parent || (range.start >= parent.start && range.end <= parent.end)
}

function isDetachedImportantSuffix(token: string) {
    return /^!(?:$|[:@_>+~].*)/.test(token)
}

export function formatMasterCSSClassList(classList: string) {
    const tokens = classList.trim().split(/\s+/).filter(Boolean)
    const formatted: string[] = []
    for (const token of tokens) {
        const previousIndex = formatted.length - 1
        if (previousIndex >= 0 && isDetachedImportantSuffix(token)) {
            formatted[previousIndex] += token
            continue
        }
        formatted.push(token)
    }
    return formatted.join(' ')
}

function createEdit(source: string, start: number, end: number, newText: string): MasterCSSDirectiveFormatEdit | undefined {
    if (source.slice(start, end) === newText) return
    return { start, end, newText }
}

function applyRelativeEdits(source: string, edits: MasterCSSDirectiveFormatEdit[]) {
    let result = source
    for (const edit of [...edits].sort((a, b) => b.start - a.start || b.end - a.end)) {
        result = result.slice(0, edit.start) + edit.newText + result.slice(edit.end)
    }
    return result
}

function normalizePreludeText(source: string, directive: CSSDirectiveRuleRange) {
    const rawPrelude = source.slice(directive.preludeRange.start, directive.preludeRange.end)
    const trimmedPrelude = rawPrelude.trim()
    if (directive.blockRange) {
        return trimmedPrelude ? ` ${trimmedPrelude} ` : ' '
    }
    return trimmedPrelude ? ` ${trimmedPrelude}` : ''
}

function formatSafelistPrelude(source: string, directive: CSSDirectiveRuleRange) {
    const prelude = source.slice(directive.preludeRange.start, directive.preludeRange.end)
    const relativeEdits: MasterCSSDirectiveFormatEdit[] = []
    for (const stringRange of collectCSSQuotedStringRanges(source, directive.preludeRange.start, directive.preludeRange.end)) {
        const contentStart = stringRange.contentRange.start - directive.preludeRange.start
        const contentEnd = stringRange.contentRange.end - directive.preludeRange.start
        const formattedClassList = formatMasterCSSClassList(source.slice(stringRange.contentRange.start, stringRange.contentRange.end))
        const edit = createEdit(prelude, contentStart, contentEnd, formattedClassList)
        if (edit) relativeEdits.push(edit)
    }
    const formattedPrelude = applyRelativeEdits(prelude, relativeEdits).trim()
    return formattedPrelude ? ` ${formattedPrelude}` : ''
}

function formatComposePrelude(source: string, directive: CSSDirectiveRuleRange) {
    if (directive.blockRange || directive.quotedStringRanges.length) return
    const classList = source.slice(directive.preludeRange.start, directive.preludeRange.end)
    const formattedClassList = formatMasterCSSClassList(classList)
    return formattedClassList ? ` ${formattedClassList}` : ''
}

function formatDirectivePrelude(source: string, directive: CSSDirectiveRuleRange) {
    switch (directive.name) {
        case 'compose':
            return formatComposePrelude(source, directive)
        case 'safelist':
            return formatSafelistPrelude(source, directive)
        default:
            return normalizePreludeText(source, directive)
    }
}

function collectDirectiveFormatEdits(source: string, directive: CSSDirectiveRuleRange) {
    const edits: MasterCSSDirectiveFormatEdit[] = []
    const formattedPrelude = formatDirectivePrelude(source, directive)
    if (formattedPrelude !== undefined) {
        const preludeEdit = createEdit(source, directive.preludeRange.start, directive.preludeRange.end, formattedPrelude)
        if (preludeEdit) edits.push(preludeEdit)
    }
    return edits
}

export function formatMasterCSSDirectives(source: string, options: FormatMasterCSSDirectivesOptions = {}) {
    const edits: MasterCSSDirectiveFormatEdit[] = []
    for (const directive of collectCSSDirectiveRanges(source)) {
        if (options.range && !isWithinRange(directive, options.range) && !rangesEqual(directive.preludeRange, options.range)) {
            continue
        }
        for (const edit of collectDirectiveFormatEdits(source, directive)) {
            if (isWithinRange(edit, options.range)) edits.push(edit)
        }
    }
    return edits
}

export function applyMasterCSSDirectiveFormatEdits(source: string, edits: MasterCSSDirectiveFormatEdit[]) {
    return applyRelativeEdits(source, edits)
}
