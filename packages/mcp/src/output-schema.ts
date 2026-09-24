import * as z from 'zod/v4'

const object = z.object({}).passthrough()
const strings = z.array(z.string())
const matchStatus = z.enum(['matched', 'unmatched', 'ambiguous', 'syntax-error'])
const cssValueStatus = z.enum(['valid', 'invalid', 'unknown', 'not-checked'])
const browserSupport = z.enum(['supported', 'unsupported', 'unknown', 'not-checked'])
const diagnostic = z.object({
  code: z.string().optional(),
  phase: z.string().optional(),
  severity: z.string().optional(),
  message: z.string(),
  notes: strings.optional()
}).passthrough()
const metadata = z.object({
  context: z.enum(['project', 'preset']),
  status: z.enum(['loaded', 'error']),
  fingerprint: z.string().nullable(),
  entries: strings,
  dependencies: strings,
  versions: z.object({ languageVersion: z.number(), bindingAbiVersion: z.number(), packageVersion: z.string() }).passthrough().optional()
}).passthrough()
const inspection = z.object({
  className: z.string(), matchStatus, cssValueStatus, browserSupport,
  checks: z.array(z.object({ name: z.string(), version: z.string(), phase: z.string() })),
  declarations: z.array(z.object({ property: z.string(), value: z.string(), status: cssValueStatus }).passthrough()),
  rules: z.array(object), variables: z.array(object), diagnostics: z.array(diagnostic).optional()
}).passthrough()
const css = z.object({ bytes: z.number(), text: z.string().optional() }).passthrough()

// Success and error results share an object envelope. Fields are optional in the
// JSON schema because errors have no success payload; refinement checks success.
const contributor = { root: z.string(), status: z.enum(['loaded', 'limited']), inputs: object, affectedPackages: z.array(object), risks: z.array(object) }
const preview = z.object({ confirmToken: z.string(), expiresAt: z.number(), changes: z.array(object), summary: object }).passthrough()
const fields: Record<string, z.ZodRawShape> = {
  mastercss_workspace_info: { root: z.string(), roots: strings, packages: object, manifest: metadata },
  mastercss_setup_audit: { root: z.string(), status: z.string(), packageJSON: object, packages: object, integrations: z.array(object), manifest: metadata, summary: object },
  mastercss_repo_context: { ...contributor, context: object, validation: object },
  mastercss_change_impact: { ...contributor, summary: object },
  mastercss_test_router: { ...contributor, validation: object },
  mastercss_package_graph: { root: z.string(), status: z.enum(['loaded', 'limited']), packages: z.array(object), summary: object },
  mastercss_lint_project: { root: z.string(), manifest: metadata, files: z.array(object), summary: object },
  mastercss_lint_content: { root: z.string(), manifest: metadata, files: z.array(object), summary: object },
  mastercss_preview_fixes: { manifest: metadata, mode: z.enum(['lint-fixes', 'generated-css']), preview },
  mastercss_preview_directive_format: { root: z.string(), manifest: metadata, mode: z.enum(['content', 'files']), files: z.array(object), summary: object },
  mastercss_apply_preview: { applied: z.literal(true), changes: z.array(z.object({ filePath: z.string(), afterHash: z.string() })) },
  mastercss_inspect_class: { manifest: metadata, ...inspection.shape, css: z.string() },
  mastercss_render_css: { manifest: metadata, classes: strings, inspections: z.array(inspection), invalid: strings, css },
  mastercss_trace_class: { manifest: metadata, inspection, occurrences: z.array(object), status: z.string(), css },
  mastercss_extract_classes: { manifest: metadata, files: z.array(z.object({ filePath: z.string(), classes: z.array(z.object({ token: z.string(), matchStatus, cssValueStatus, browserSupport, inspection }).passthrough()) }).passthrough()), summary: object },
  mastercss_scan_project: { manifest: metadata, files: z.array(object), scanner: object, stylesheets: object, css, summary: object },
  mastercss_inspect_directives: { context: metadata, manifest: object, directiveEntries: z.array(object), dependencies: strings, css, summary: object },
  mastercss_manifest_query: { manifest: metadata, results: object, summary: object },
  mastercss_css_compare: { manifest: metadata, classes: object, css: object, rules: object, summary: object },
  mastercss_suggest_syntax: { manifest: metadata, completions: z.array(object), total: z.number() }
}

export function toolOutputSchema(name: string) {
  if (!fields[name]) throw new Error(`Missing output schema for ${name}`)
  const payload = z.object(fields[name]).passthrough()
  return z.object({
    version: z.literal(2), diagnostics: z.array(diagnostic),
    status: z.string().optional(),
    ...payload.partial().shape
  }).passthrough().superRefine((value, ctx) => {
    if (value.status === 'error') return
    const result = payload.safeParse(value)
    if (!result.success) for (const issue of result.error.issues) ctx.addIssue({ code: 'custom', path: issue.path, message: issue.message })
  })
}
