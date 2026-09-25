import * as z from 'zod/v4'
import { strings, range, diagnostic, inspection, matchStatus, cssStatus, browserSupport } from './semantic-schema'
const count = z.number().int().nonnegative()
const counts = (...names: string[]) => z.object(Object.fromEntries(names.map(name => [name, count])))
const position = z.object({ line: count, character: count })
const location = z.object({ start: position, end: position })
export const occurrence = z.object({
  candidate: z.string(), source: z.string(), range, contextRange: range,
  rangeKind: z.enum(['token', 'expression']), extractor: z.string(), contentKind: z.string(),
  owner: z.string(), included: z.boolean(), reason: z.string()
})
export const extractedFile = z.object({
  filePath: z.string(), languageId: z.string(), occurrences: z.array(occurrence),
  classes: z.array(z.object({
    raw: z.string(), token: z.string(), range, loc: location, contextRange: range,
    sourceKind: z.string(), provenance: occurrence, status: z.string(),
    matchStatus, cssSyntaxStatus: cssStatus, cssValueStatus: cssStatus, browserSupport, inspection
  }))
})
const sourceFix = z.object({
  kind: z.enum(['class-list', 'directive']), safety: z.enum(['safe', 'structural']),
  range, text: z.string(), description: z.string(), requiresFormatting: z.boolean()
})
export const lintFile = z.object({
  filePath: z.string(), languageId: z.string(), sourceKind: z.enum(['source', 'stylesheet', 'manifest']),
  diagnostics: z.array(diagnostic.extend({
    code: z.string(), severity: z.enum(['error', 'warning']), range,
    loc: z.object({ start: z.object({ line: count, column: count }), end: z.object({ line: count, column: count }) }),
    source: z.literal('Master CSS'), sourceKind: z.string(), fixes: z.array(sourceFix).optional()
  }))
})
export const lintSummary = counts('files', 'diagnostics', 'errors', 'warnings', 'fixable', 'safeFixes', 'structuralFixes')
export const formatFile = z.object({ filePath: z.string(), languageId: z.string(), edits: z.array(z.object({ range: location, newText: z.string() })), changed: z.boolean(), beforeBytes: count, afterBytes: count })
const sourceReference = z.object({ file: z.string().optional(), range, loc: z.object({ start: z.object({ line: count, column: count }), end: z.object({ line: count, column: count }) }).optional() })
export const compositionTrace = z.object({ order: count, classes: strings, source: sourceReference.optional(), definitionSources: z.array(sourceReference), css: z.string(), variableNames: strings, animationNames: strings })
const discovered = z.object({ latent: strings, valid: strings, invalid: strings, usedNative: strings })
export const scannedFile = z.object({ filePath: z.string(), source: z.string(), scanned: z.boolean(), changed: z.boolean(), discovered })
export const scanner = z.object({ counts: counts('latent', 'valid', 'invalid', 'native', 'usedNative', 'safelist', 'blocklist'), classes: discovered.extend({ native: strings, safelist: strings, blocklist: strings }), resetDependencies: strings })
export const stylesheets = z.object({
  entries: z.array(z.object({ compositions: z.array(compositionTrace).optional(), filePath: z.string(), masterCSS: z.boolean(), pruneNativeCSS: z.boolean(), dependencies: strings, sourceDependencies: strings, warnings: strings, errors: strings })),
  dependencies: strings, warnings: strings, errors: z.array(z.object({ filePath: z.string(), message: z.string() }))
})
export const scanSummary = counts('files', 'stylesheets', 'diagnostics', 'errors', 'warnings', 'missingCSS', 'invalidClasses')
export const previewSummary = counts('files', 'bytesBefore', 'bytesAfter')
export const formatSummary = counts('files', 'changed', 'edits')
export const extractSummary = counts('files', 'classes', 'matched', 'unmatched').extend({ diagnostics: count.optional() })
