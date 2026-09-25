import * as z from 'zod/v4'
import { lintFile, lintSummary, formatFile, formatSummary, extractedFile, extractSummary, scannedFile, scanner, stylesheets, scanSummary, previewSummary } from './source-schema'

import { strings, diagnostic, metadata, inspection, envelopeMetadata, manifestResults, change, completion, classDiff, ruleDiff, range } from './semantic-schema'

// Non-semantic host metadata is an explicitly JSON-valued dictionary.
const object = z.record(z.string(), z.json())
const css = z.object({ bytes: z.number(), text: z.string().optional() }).passthrough()

const contributor = { root: z.string(), status: z.enum(['loaded', 'limited']), inputs: object, affectedPackages: z.array(object), risks: z.array(object) }
const preview = z.object({ confirmToken: z.string().optional(), expiresAt: z.number().optional(), changes: z.array(change), summary: previewSummary }).passthrough()
const fields: Record<string, z.ZodRawShape> = {
  mastercss_workspace_info: { root: z.string(), roots: strings, packages: object, manifest: metadata },
  mastercss_setup_audit: { root: z.string(), status: z.string(), packageJSON: object, packages: object, integrations: z.array(object), manifest: metadata, summary: object },
  mastercss_repo_context: { ...contributor, context: object, validation: object },
  mastercss_change_impact: { ...contributor, summary: object },
  mastercss_test_router: { ...contributor, validation: object },
  mastercss_package_graph: { root: z.string(), status: z.enum(['loaded', 'limited']), packages: z.array(object), summary: object },
  mastercss_lint_project: { root: z.string(), manifest: metadata, files: z.array(lintFile), summary: lintSummary },
  mastercss_lint_content: { root: z.string(), manifest: metadata, files: z.array(lintFile), summary: lintSummary },
  mastercss_preview_fixes: { manifest: metadata, mode: z.enum(['lint-fixes', 'generated-css']), preview },
  mastercss_preview_directive_format: { root: z.string(), manifest: metadata, mode: z.enum(['content', 'files']), files: z.array(formatFile), summary: formatSummary },
  mastercss_apply_preview: { applied: z.literal(true), changes: z.array(z.object({ filePath: z.string(), afterHash: z.string() })) },
  mastercss_inspect_class: { manifest: metadata, ...inspection.shape, css: z.string() },
  mastercss_render_css: { manifest: metadata, classes: strings, inspections: z.array(inspection), invalid: strings, css },
  mastercss_trace_class: { manifest: metadata, inspection, occurrences: z.array(z.object({ filePath: z.string(), source: z.string(), statuses: strings })), status: z.string(), css },
  mastercss_extract_classes: { manifest: metadata, files: z.array(extractedFile), summary: extractSummary },
  mastercss_scan_project: { manifest: metadata, files: z.array(scannedFile), scanner, stylesheets, css, summary: scanSummary },
  mastercss_inspect_directives: { context: metadata, manifest: object, directiveEntries: z.array(z.object({ name: z.string(), range, prelude: z.string(), hasBlock: z.boolean(), quotedStrings: z.number() }).passthrough()), dependencies: strings, css, summary: object },
  mastercss_manifest_query: { manifest: metadata, results: manifestResults, summary: object },
  mastercss_css_compare: { manifest: metadata, classes: classDiff, css: z.object({ changed: z.boolean(), before: css, after: css, bytesDelta: z.number(), diff: z.string() }), rules: ruleDiff, summary: object },
  mastercss_suggest_syntax: { manifest: metadata, completions: z.array(completion), total: z.number() }
}

export function toolOutputSchema(name: string) {
  if (!fields[name]) throw new Error(`Missing output schema for ${name}`)
  const payload = z.object(fields[name]).passthrough()
  return z.object({
    version: z.literal(3), metadata: envelopeMetadata, diagnostics: z.array(diagnostic),
    result: z.discriminatedUnion('status', [
      z.object({ status: z.literal('success'), data: payload }),
      z.object({ status: z.literal('error'), error: z.object({ code: z.string(), message: z.string() }) })
    ])
  })
}
