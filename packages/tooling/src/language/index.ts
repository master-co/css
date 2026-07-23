import type { MasterCSSBackend } from '@master/css-backend'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { createToolingSession } from '../tooling-session'
import type {
  MasterCSSDocumentAnalysis,
  MasterCSSDocumentAnalysisRequest,
  MasterCSSFormatDirectivesRequest,
  MasterCSSFormatDirectivesResult
} from './contracts'

export {
  SEMANTIC_TOKEN_MODIFIERS,
  SEMANTIC_TOKEN_TYPES,
  SEMANTIC_TOKENS_LEGEND,
  AT_TRIGGER_CHARACTER,
  DECLARATION_SEPARATOR_TRIGGER_CHARACTER,
  GROUP_TRIGGER_CHARACTER,
  INVOKED_TRIGGER_CHARACTERS,
  QUERY_TRIGGER_CHARACTERS,
  SELECTOR_TRIGGER_CHARACTERS,
  VALUE_TRIGGER_CHARACTERS
} from './common'
export {
  AT_SIGN,
  CLASS_ATTRIBUTES,
  CLASS_DECLARATIONS,
  CLASS_FUNCTIONS,
  DELIMITER_SIGN,
  QUERY_COMPARISON_OPERATORS,
  QUERY_LOGICAL_OPERATORS,
  SELECTOR_SIGNS,
  SEPARATOR_SIGN,
  matchesLanguageServiceNativeDeclaration
} from './master-css'
export {
  type HighlightTokenRole,
  type SemanticTokenItem,
  type SemanticTokenModifier,
  type SemanticTokenType
} from './semantic/types'
export {
  getMasterCSSSemanticTokenScopeKeys,
  MASTER_CSS_SEMANTIC_TOKEN_SCOPE_MAP
} from './semantic/scopes'
export type {
  MasterCSSDocumentAnalysis,
  MasterCSSDocumentAnalysisRequest,
  MasterCSSFormatDirectivesRequest,
  MasterCSSFormatDirectivesResult,
  MasterCSSLanguageClass,
  MasterCSSLanguageClassifications,
  MasterCSSLanguageClassKind,
  MasterCSSLanguageClassListContext,
  MasterCSSLanguageClassPosition,
  MasterCSSLanguageClassVariable,
  MasterCSSLanguageColorCandidate,
  MasterCSSLanguageColorPresentation,
  MasterCSSLanguageColorToken,
  MasterCSSLanguageColorTokens,
  MasterCSSLanguageCompletionEntry,
  MasterCSSLanguageCompletionIndex,
  MasterCSSLanguageCompletionKind,
  MasterCSSLanguageInspection,
  MasterCSSLanguageVariable
} from './contracts'

export async function analyzeDocument(
  request: MasterCSSDocumentAnalysisRequest,
  options: {
    readonly manifest: MasterCSSManifest
    readonly backend?: MasterCSSBackend
  }
): Promise<MasterCSSDocumentAnalysis> {
  const session = await createToolingSession(options)
  try {
    return session.analyzeDocument(request)
  } finally {
    session.dispose()
  }
}

export async function inspectClassName(
  className: string,
  options: {
    readonly manifest: MasterCSSManifest
    readonly backend?: MasterCSSBackend
    readonly mode?: string
  }
) {
  const session = await createToolingSession(options)
  try {
    return session.inspectClassName(className, options.mode)
  } finally {
    session.dispose()
  }
}

export async function formatDirectives(
  request: MasterCSSFormatDirectivesRequest,
  options: {
    readonly manifest: MasterCSSManifest
    readonly backend?: MasterCSSBackend
  }
): Promise<MasterCSSFormatDirectivesResult> {
  const session = await createToolingSession(options)
  try {
    return session.formatDirectives(request)
  } finally {
    session.dispose()
  }
}
