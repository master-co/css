# Review and debug

| Observation | Next evidence |
| --- | --- |
| Missing project manifest | `mastercss_workspace_info`, then `mastercss_setup_audit` |
| Uncertain class spelling or token | `mastercss_manifest_query`, then `mastercss_inspect_class` |
| Valid class absent from the page | `mastercss_trace_class` for extraction, entry and delivery evidence |
| Invalid or conflicting classes | `mastercss_lint_content` for the relevant source buffer |
| CSS exists but looks wrong | Browser cascade, layer, specificity, variables, conditions and computed styles |
| A definition edit affects other components | `mastercss_scan_project` snapshots and `mastercss_css_compare` |

Limit scans to the relevant files before widening. A native CSS class can be valid
without producing a Master-generated rule. A dynamic fragment such as
`'bg-' + color` is not a complete statically extractable class.

Do not treat a successful tool call as a successful style: read its result and
diagnostics. Preserve unknown native CSS; flag known invalid values. Suggestions
do not override project design-token policy.

## CLI without MCP

Use the project's installed, version-matched `@master/css-cli`, and confirm its
`--help` if commands differ. Existing JSON commands include:

```sh
npx @master/css-cli lint --format json --exit-code never
npx @master/css-cli inspect --format json --exit-code never
```

`--exit-code never` supports consuming diagnostics as data; read them before
declaring success. Use the project's normal failing lint/build commands for final
validation. Do not install a different release merely to obtain a missing tool.

For MCP's generated fixes, inspect the preview and use its confirmation token only
for the authorized changes. A stale preview requires regenerating the diff.
Ordinary component edits use the agent's normal source-editing tools.
