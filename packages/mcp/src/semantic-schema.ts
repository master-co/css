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
  value: z.union([z.string(), z.number(), z.literal(false), z.array(z.union([z.string(), z.number()]))]).optional(),
  numeric: numeric.optional(), dependencies: strings,
  modes: z.record(z.string(), z.object({ type: z.enum(['string', 'number']), value: z.union([z.string(), z.number()]), numeric: numeric.optional() })).optional(),
  inline: z.boolean().optional(), static: z.boolean().optional(), mode: z.string().optional()
})
const bound = z.object({ value: z.number(), inclusive: z.boolean() }).nullable()
export const rule = z.object({
  className: z.string(), key: z.string(), layer: z.enum(['base', 'defaults', 'components', 'utilities']),
  type: z.number(), sortTier: z.number(), text: z.string().optional(), selectorText: z.string().optional(),
  priority: z.object({ features: z.array(z.object({ domain: z.string(), feature: z.string(), unit: z.string(), lower: bound, upper: bound })), selector: z.number(), conditions: strings.optional(), sortKey: z.string().optional(), valuePriority: z.number().optional() }),
  nodes: z.array(z.object({ text: z.string() })).optional(), variableNames: strings.optional(), animationNames: strings.optional()
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

const declarationValue = z.union([z.string(), z.number(), z.null()])
const declarations = z.record(z.string(), z.union([declarationValue, z.array(declarationValue)]))
const matcher = z.discriminatedUnion('type', [
  z.object({ type: z.literal('static'), name: z.string() }),
  z.object({ type: z.literal('pattern'), prefix: z.string(), values: strings, valueMap: z.record(z.string(), z.string()).optional() }),
  z.object({ type: z.literal('key'), keys: strings }),
  z.object({ type: z.literal('token'), prefix: z.string() })
])
const emit = z.discriminatedUnion('type', [
  z.object({ type: z.literal('declarations'), declarations: strings }),
  z.object({ type: z.literal('template'), declarations }),
  z.object({ type: z.literal('property'), property: z.string() }),
  z.object({ type: z.literal('static'), rules: z.array(z.object({ declarations, selector: z.string().optional(), conditions: strings.optional() })) })
])
export const utility = z.object({
  id: z.string(), type: z.number(), matchers: z.array(matcher), emit,
  key: z.string().optional(), keys: strings.optional(), subkey: z.string().optional(), name: z.string().optional(),
  order: z.number().optional(), layer: z.string().optional(), namespaces: strings.optional(),
  variableAliases: z.array(z.tuple([z.string(), z.string()])).optional(), variableAliasRefs: strings.optional(), aliasGroups: strings.optional(), conditions: strings.optional(),
  matcherTypes: strings, emitType: z.string()
}).passthrough()
const conditionNode: z.ZodType = z.lazy(() => z.union([
  z.object({ type: z.literal('boolean'), name: z.string(), raw: z.string().optional() }),
  z.object({ type: z.literal('number'), value: z.number(), name: z.string().optional(), unit: z.string().optional(), operator: z.string().optional(), raw: z.string().optional() }),
  z.object({ type: z.enum(['string', 'logical', 'comparison']), value: z.string(), name: z.string().optional(), raw: z.string().optional() }),
  z.object({ type: z.literal('group').optional(), children: z.array(conditionNode), raw: z.string().optional() })
]))
export const manifestResults = z.object({
  tokens: z.array(variable), utilities: z.array(utility),
  variants: z.array(z.object({ token: z.string(), branches: z.number(), layers: strings })),
  modes: z.array(z.object({ name: z.string(), branches: z.array(z.object({ selector: z.string(), conditions: strings.optional() })) })),
  conditions: z.array(z.object({ name: z.string(), id: z.string(), nodes: z.array(conditionNode), nodeCount: z.number() })),
  aliases: z.array(z.discriminatedUnion('type', [
    z.object({ type: z.literal('variable-alias'), utility: z.string(), key: z.string(), name: z.string() }),
    z.object({ type: z.literal('variable-alias-ref'), utility: z.string(), ref: z.string() }),
    z.object({ type: z.literal('alias-group'), utility: z.string(), group: z.string() })
  ]))
})
export const change = z.object({ filePath: z.string(), beforeHash: z.string().nullable(), afterHash: z.string(), beforeExists: z.boolean(), beforeBytes: z.number(), afterBytes: z.number(), afterText: z.string(), diff: z.string() })
export const completion = z.object({ label: z.string(), kind: z.number().optional(), detail: z.string().optional(), insertText: z.string().optional(), sortText: z.string().optional(), documentation: z.union([z.string(), z.object({ kind: z.string(), value: z.string() })]).optional() }).passthrough()
export const classDiff = z.object({ added: strings, removed: strings, unchanged: strings })
export const ruleDiff = z.object({ added: strings, removed: strings, unchanged: z.number() })
