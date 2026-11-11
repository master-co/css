import * as z from 'zod/v4'
import { strings, metadata } from './semantic-schema'

const count = z.number().int().nonnegative()
const owner = z.object({ package: z.string(), version: z.string().nullable() })

/** Where a contract comes from: the library that ships it, or the project file that defines or replaces it. */
export const contractSource = z.discriminatedUnion('kind', [
  owner.extend({ kind: z.literal('package') }),
  z.object({ kind: z.literal('project'), file: z.string(), replaces: owner.optional() })
])

const library = z.object({ name: z.string(), version: z.string().nullable(), count, checker: z.boolean() })
const entry = z.object({
  name: z.string(), title: z.string().optional(), tier: z.string().optional(), category: z.string().optional(),
  description: z.string().optional(), use: z.string().optional(), script: z.string().optional(), source: contractSource
})
// A contract's vocabulary belongs to its design system; only the name and the class list are required.
const contract = z.object({ name: z.string(), classes: z.array(z.json()) }).passthrough()
const diagnostic = z.object({
  code: z.string(), severity: z.enum(['error', 'warning', 'info']), message: z.string(),
  line: count, column: count, className: z.string().optional(), contract: z.string().optional(), source: z.string()
})

export const contractList = {
  version: z.literal(1), root: z.string(), libraries: z.array(library), contracts: z.array(entry),
  summary: z.object({ libraries: count, contracts: count, returned: count }), note: z.string().optional()
}
export const contractGet = {
  version: z.literal(1), root: z.string(), name: z.string(), matched: z.enum(['contract', 'class']), contract, source: contractSource
}
export const contractCheck = {
  version: z.literal(1), root: z.string(), manifest: metadata.optional(), libraries: z.array(library),
  checkers: z.array(owner.extend({ contracts: count })),
  classValidation: z.enum(['project-manifest', 'none']), strict: z.boolean(),
  files: z.array(z.object({ filePath: z.string(), diagnostics: z.array(diagnostic) })),
  coverage: z.object({
    status: z.enum(['complete', 'no-inputs', 'no-checker', 'no-contracts']), checkedFiles: strings,
    skippedFiles: z.array(z.object({ filePath: z.string(), reason: z.string() })), description: z.string()
  }),
  summary: z.object({ checkedFiles: count, filesWithDiagnostics: count, diagnostics: count, errors: count, warnings: count }),
  note: z.string().optional()
}
