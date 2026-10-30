import * as z from 'zod/v4'
import { range, strings } from './semantic-schema'

const tokenMetadata = z.object({
  description: z.string().optional(),
  deprecated: z.boolean().optional(),
  replacement: z.string().optional()
}).strict()

export const designSystemOptions = z.object({
  version: z.literal(1),
  metadata: z.record(z.string(), tokenMetadata).optional(),
  rawValuePolicy: z.object({
    allowRawValues: z.boolean().optional(),
    allowProperties: strings.optional(),
    requireProperties: strings.optional(),
    allowedPatterns: strings.optional()
  }).strict().optional()
}).strict()

export const designSystemReport = z.object({
  version: z.literal(1),
  tokens: z.array(z.object({ name: z.string(), metadata: tokenMetadata.optional() })),
  references: z.array(z.object({
    source: z.string(),
    token: z.string(),
    registered: z.boolean(),
    range,
    property: z.string(),
    declarationRange: range,
    ancestry: z.array(z.object({
      kind: z.enum(['selector', 'at-rule']),
      name: z.string().optional(),
      prelude: z.string(),
      range
    })),
    hasFallback: z.boolean(),
    inFallback: z.boolean(),
    importers: strings
  })),
  collisions: z.array(z.object({
    prefix: z.string(),
    key: z.string(),
    className: z.string(),
    namespaces: strings,
    properties: strings
  })),
  diagnostics: z.array(z.object({
    code: z.string(),
    severity: z.enum(['error', 'warning', 'information']),
    message: z.string(),
    source: z.string().optional(),
    range: range.optional(),
    token: z.string().optional(),
    data: z.record(z.string(), z.json()).optional()
  })),
  coverage: z.object({ scope: z.literal('provided-stylesheets'), browser: z.literal('not-checked'), notes: strings }),
  summary: z.object({
    stylesheets: z.number(), tokens: z.number(), references: z.number(), collisions: z.number(), errors: z.number(), warnings: z.number()
  }),
  project: z.object({
    cwd: z.string(),
    entries: strings,
    files: strings,
    excluded: strings,
    edges: z.array(z.object({ from: z.string(), specifier: z.string(), resolved: z.string() }))
  })
})
