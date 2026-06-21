import type { SemanticTokenModifier, SemanticTokenType } from './types'

export const MASTER_CSS_SEMANTIC_TOKEN_SCOPE_MAP = {
    class: ['entity.other.attribute-name.class.css'],
    'class.component': ['entity.other.attribute-name.class.css'],
    'class.declaration': ['entity.other.attribute-name.class.css'],
    'class.selector': ['entity.other.attribute-name.class.css'],
    enumMember: ['support.constant.property-value.css'],
    'enumMember.directive': ['support.constant.property-value.css'],
    'enumMember.query': ['support.constant.property-value.css'],
    'enumMember.unit': ['keyword.other.unit'],
    property: ['support.type.property-name.css'],
    'property.directive': ['support.type.property-name.css'],
    'property.query': ['support.type.property-name.css'],
    variable: ['variable.other.master-css.css', 'variable.css'],
    'variable.directive': ['variable.parameter.master-css.css'],
    'variable.selector': ['entity.other.attribute-name.id.css'],
    function: ['support.function.misc.css'],
    number: ['constant.numeric.css'],
    'number.query': ['constant.numeric.css'],
    string: ['string.quoted.css', 'string.quoted.html'],
    'string.quoted': ['string.quoted.css', 'string.quoted.html'],
    keyword: ['keyword.control.at-rule'],
    'keyword.directive': ['keyword.control.at-rule.master-css.css'],
    'keyword.query': ['keyword.control.at-rule'],
    modifier: ['entity.other.attribute-name.pseudo-class.css'],
    'modifier.directive': ['storage.modifier.master-css.css'],
    'modifier.pseudoClass': ['entity.other.attribute-name.pseudo-class.css'],
    'modifier.pseudoElement': ['entity.other.attribute-name.pseudo-element.css'],
    operator: ['keyword.operator.css'],
    'operator.directive': ['punctuation.section.property-list.begin.bracket.curly.css'],
    'operator.important': ['keyword.operator.important.css'],
    'operator.pseudoClass': ['entity.other.attribute-name.pseudo-class.css'],
    'operator.pseudoElement': ['entity.other.attribute-name.pseudo-element.css'],
    'operator.query': ['keyword.operator.css'],
    'operator.selector': ['keyword.operator.combinator'],
    'operator.unit': ['keyword.operator.css'],
    type: ['entity.name.tag.css'],
    'type.selector': ['entity.name.tag.css']
} as const satisfies Record<string, string[]>

export type MasterCSSSemanticTokenScopeKey = keyof typeof MASTER_CSS_SEMANTIC_TOKEN_SCOPE_MAP

export function getMasterCSSSemanticTokenScopeKeys(type: SemanticTokenType, modifiers: SemanticTokenModifier[] = []) {
    const keys: string[] = []
    for (const modifier of [...modifiers].reverse()) {
        keys.push(`${type}.${modifier}`)
    }
    keys.push(type)
    return keys.filter((key): key is MasterCSSSemanticTokenScopeKey => key in MASTER_CSS_SEMANTIC_TOKEN_SCOPE_MAP)
}
