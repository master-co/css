export { default, default as CSSLanguageService } from './core'
export { default as settings, type Settings } from './settings'
export * from './common'
export {
    MASTER_CSS_SEMANTIC_TOKEN_SCOPE_MAP,
    getMasterCSSSemanticTokenScopeKeys
} from './semantic/scopes'
export type { MasterCSSSemanticTokenScopeKey } from './semantic/scopes'

export { default as inspectSyntax } from './features/inspect-syntax'
export { default as renderSyntaxColors } from './features/render-syntax-colors'
export { default as editSyntaxColors } from './features/edit-syntax-colors'
export {
    default as renderSemanticTokens,
    renderSemanticTokensAtPosition,
    collectActiveHighlightTokenItems,
    collectCSSDocumentHighlightTokenItems,
    collectDocumentHighlightTokenItems,
    collectDocumentSemanticTokenItems,
    collectEmbeddedHighlightTokenItems,
    collectHighlightTokenItems,
    collectSemanticTokenItems,
    encodeSemanticTokens
} from './features/render-semantic-tokens'
export type { HighlightTokenItem } from './features/render-semantic-tokens'
export { default as suggestSyntax } from './features/suggest-syntax'
