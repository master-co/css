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

const ROLE_TOKEN_MODIFIERS: Partial<Record<HighlightTokenRole, SemanticTokenModifier>> = {
    'block.brace': 'blockBrace',
    'declaration.separator': 'declarationSeparator',
    'declaration.terminator': 'declarationTerminator',
    'directive.terminator': 'directiveTerminator',
    'query.operator': 'queryOperator',
    'query.punctuation': 'queryPunctuation',
    'selector.combinator': 'selectorCombinator',
    'selector.punctuation': 'selectorPunctuation',
    'selector.pseudoClass.delimiter': 'pseudoClassDelimiter',
    'selector.pseudoElement.delimiter': 'pseudoElementDelimiter',
    'value.function.punctuation': 'functionPunctuation',
    'value.operator': 'valueOperator',
    'value.separator': 'valueSeparator'
}

function withRoleModifier(role: HighlightTokenRole, modifiers: SemanticTokenModifier[] = []) {
    const roleModifier = ROLE_TOKEN_MODIFIERS[role]
    return roleModifier && !modifiers.includes(roleModifier)
        ? [...modifiers, roleModifier]
        : modifiers
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
    return tokens.map(({ start, end, type, role, modifiers }) => ({
        start,
        end,
        type,
        modifiers: withRoleModifier(role, modifiers)
    }))
}
