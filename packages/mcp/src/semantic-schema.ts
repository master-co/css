import * as z from 'zod/v4'

export const strings = z.array(z.string())
export const range = z.object({ start: z.number(), end: z.number() })
const position = z.object({ line: z.number(), character: z.number() })
export const diagnostic = z.object({
  code: z.string().optional(), phase: z.string().optional(), severity: z.union([z.string(), z.number()]).optional(),
  message: z.string(), notes: strings.optional(), alternatives: strings.optional(),
  source: z.string().optional(), range: z.union([range, z.object({ start: position, end: position })]).optional()
}).passthrough()
export const matchStatus = z.enum(['matched', 'unmatched', 'ambiguous', 'syntax-error'])
export const cssStatus = z.enum(['valid', 'invalid', 'unknown', 'not-checked'])
export const browserSupport = z.enum(['supported', 'unsupported', 'unknown', 'not-checked'])
const numeric = z.object({ value: z.number(), unit: z.string().optional() })
export const variable = z.object({
  key: z.string(), name: z.string(), namespace: z.string().optional(), type: z.string(),
  values: z.array(z.object({ path: strings, value: z.string(), inline: z.boolean().optional(), static: z.boolean().optional() })),
  numeric: numeric.optional(), dependencies: strings
})
const bound = z.object({ value: z.number(), inclusive: z.boolean() }).nullable()
export const rule = z.object({
  className: z.string(), key: z.string(), layer: z.enum(['base', 'defaults', 'components', 'utilities']),
  type: z.number(), sortTier: z.number(), text: z.string().optional(), selectorText: z.string().optional(),
  priority: z.object({ features: z.array(z.object({ domain: z.string(), feature: z.string(), unit: z.string(), lower: bound, upper: bound })), selector: z.number(), conditions: strings.optional(), sortKey: z.string().optional(), valuePriority: z.number().optional() }),
  nodes: z.array(z.object({ text: z.string() })).optional(), variableNames: strings.optional()
})
export const inspection = z.object({
  className: z.string(), matchStatus, cssSyntaxStatus: cssStatus, cssValueStatus: cssStatus, browserSupport,
  checks: z.array(z.object({ name: z.string(), version: z.string(), phase: z.string(), scope: z.string() })),
  declarations: z.array(z.object({ property: z.string(), value: z.string(), status: cssStatus, range: range.optional(), error: z.string().optional() }).passthrough()),
  rules: z.array(rule), variables: z.array(z.object({ key: z.string(), variable })), diagnostics: z.array(diagnostic).optional()
}).passthrough()
export const versions = z.object({ languageVersion: z.number(), bindingAbiVersion: z.number(), packageVersion: z.string() }).passthrough()
export const metadata = z.object({ context: z.enum(['project', 'preset']), status: z.enum(['loaded', 'error']), fingerprint: z.string().nullable(), entries: strings, dependencies: strings, versions: versions.optional() }).passthrough()
export const envelopeMetadata = z.object({ versions: versions.nullable(), context: z.enum(['project', 'preset']).nullable(), manifestFingerprint: z.string().nullable(), entries: strings, dependencies: strings })

const mixinSource = z.object({ file: z.string().optional(), range, loc: z.object({ start: z.object({ line: z.number(), column: z.number() }), end: z.object({ line: z.number(), column: z.number() }) }).optional() }).optional()
const mixinValue: z.ZodType = z.lazy(() => z.array(z.discriminatedUnion('type', [
  z.object({ type: z.literal('text'), value: z.string() }),
  z.object({ type: z.literal('function'), name: z.string(), value: mixinValue })
])))
const mixinNode: z.ZodType = z.lazy(() => z.discriminatedUnion('type', [
  z.object({ type: z.literal('declaration'), property: z.string(), value: mixinValue, source: mixinSource }),
  z.object({ type: z.literal('rule'), selector: z.string(), body: z.array(mixinNode) }),
  z.object({ type: z.literal('condition'), condition: z.string(), body: z.array(mixinNode) }),
  z.object({ type: z.literal('apply'), name: z.string(), arguments: z.array(mixinValue), contents: z.array(mixinNode).optional(), source: mixinSource }),
  z.object({ type: z.literal('contents'), fallback: z.array(mixinNode) })
]))
export const mixin = z.object({
  name: z.string(),
  parameters: z.array(z.object({ name: z.string(), syntax: z.enum(['integer', 'number', 'string', 'custom-ident']).optional(), default: z.string().optional(), source: mixinSource })),
  body: z.array(mixinNode),
  source: mixinSource
})
const mediaQuery: z.ZodType = z.lazy(() => z.union([
  z.object({ type: z.enum(['true', 'false']) }),
  z.object({ type: z.literal('feature'), value: z.string() }),
  z.object({ type: z.literal('media-type'), name: z.string() }),
  z.object({ type: z.literal('not'), query: mediaQuery }),
  z.object({ type: z.enum(['and', 'or']), queries: z.array(mediaQuery) })
]))
export const manifestResults = z.object({
  tokens: z.array(variable), mixins: z.array(mixin),
  utilities: z.array(mixin.extend({ kind: z.enum(['static', 'token', 'function']) })),
  customMedia: z.array(z.object({ name: z.string(), expression: mediaQuery })),
  families: z.array(z.object({ type: z.literal('token-family'), utility: z.string(), prefix: z.string(), namespace: z.string(), argument: z.enum(['value', 'key']), properties: strings }))
})
export const change = z.object({ filePath: z.string(), beforeHash: z.string().nullable(), afterHash: z.string(), beforeExists: z.boolean(), beforeBytes: z.number(), afterBytes: z.number(), afterText: z.string(), diff: z.string() })
export const completion = z.object({ label: z.string(), kind: z.number().optional(), detail: z.string().optional(), insertText: z.string().optional(), sortText: z.string().optional(), documentation: z.union([z.string(), z.object({ kind: z.string(), value: z.string() })]).optional() }).passthrough()
export const classDiff = z.object({ added: strings, removed: strings, unchanged: strings })
export const ruleDiff = z.object({ added: strings, removed: strings, unchanged: z.number() })
