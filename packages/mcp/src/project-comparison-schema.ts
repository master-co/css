import * as z from 'zod/v4'
import { matchStatus, rule, strings } from './semantic-schema'

const asset = z.object({ path: z.string().min(1), css: z.string() }).strict()
export const projectSnapshot = z.object({
  version: z.literal(1),
  // The compiler validates the versioned execution manifest, including unknown fields.
  manifest: z.object({ version: z.literal(5), languageVersion: z.literal(14) }).catchall(z.json()),
  sources: z.array(z.object({ path: z.string().min(1), classes: strings }).strict()),
  stylesheets: z.array(asset), outputs: z.array(asset), excluded: strings, unresolved: strings
}).strict()

const assetChange = z.object({ path: z.string(), before: z.string().nullable(), after: z.string().nullable(), changedDependencies: strings })
export const projectComparison = z.object({
  version: z.literal(1),
  definitions: z.array(z.object({ id: z.string(), before: z.json().nullable(), after: z.json().nullable() })),
  classes: z.array(z.object({
    className: z.string(), files: strings, reasons: strings, changedDependencies: strings,
    beforeMatchStatus: matchStatus.nullable(), afterMatchStatus: matchStatus.nullable(),
    beforeRules: z.array(rule), afterRules: z.array(rule)
  })),
  stylesheets: z.array(assetChange), outputs: z.array(assetChange),
  stylesheetOrderChanged: z.boolean(), outputOrderChanged: z.boolean(), files: strings,
  coverage: z.object({ scope: z.literal('known-sources'), browser: z.literal('not-checked'), excluded: strings, unresolved: strings, notes: strings })
})
