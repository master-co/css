import type { SemanticTokenItem, SemanticTokenModifier, SemanticTokenType } from './types'

export type HighlightTokenRole =
    | 'block.brace'
    | 'declaration.property'
    | 'declaration.separator'
    | 'declaration.terminator'
    | 'directive.keyword'
    | 'directive.modifier'
    | 'directive.parameter'
    | 'directive.terminator'
    | 'query.keyword'
    | 'query.feature'
    | 'query.operator'
    | 'query.punctuation'
    | 'query.value'
    | 'query.number'
    | 'query.unit'
    | 'selector.attribute'
    | 'selector.class'
    | 'selector.combinator'
    | 'selector.id'
    | 'selector.pseudoClass.delimiter'
    | 'selector.pseudoClass.name'
    | 'selector.pseudoElement.delimiter'
    | 'selector.pseudoElement.name'
    | 'selector.punctuation'
    | 'selector.type'
    | 'theme.variable'
    | 'utility.component'
    | 'utility.semantic'
    | 'value.color'
    | 'value.function.name'
    | 'value.function.punctuation'
    | 'value.important'
    | 'value.keyword'
    | 'value.number'
    | 'value.operator'
    | 'value.separator'
    | 'value.string'
    | 'value.string.quote'
    | 'value.unit'
    | 'value.variable'

export interface HighlightTokenItem extends SemanticTokenItem {
    role: HighlightTokenRole
}

export function pushHighlightToken(
    tokens: HighlightTokenItem[],
    start: number,
    length: number,
    type: SemanticTokenType,
    role: HighlightTokenRole,
    modifiers?: SemanticTokenModifier[]
) {
    if (length <= 0) return
    tokens.push({ start, end: start + length, type, role, modifiers })
}

export function toSemanticTokenItems(tokens: HighlightTokenItem[]): SemanticTokenItem[] {
    return tokens.map(({ start, end, type, modifiers }) => ({
        start,
        end,
        type,
        modifiers
    }))
}
