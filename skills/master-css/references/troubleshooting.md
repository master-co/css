# Review and debug

| Observation | Next evidence |
| --- | --- |
| Missing project manifest | `mastercss_workspace_info`, then `mastercss_setup_audit` |
| Uncertain class spelling or token | `mastercss_manifest_query`, then `mastercss_inspect_class` |
| Valid class absent from the page | `mastercss_trace_class` for extraction, entry and delivery evidence |
| Invalid or conflicting classes | Lint the relevant buffer, then inspect the actual class output and native rules |
| CSS exists but looks wrong | Browser cascade, layer, specificity, variables, conditions and computed styles |
| A definition edit affects other components | `mastercss_scan_project` snapshots and `mastercss_css_compare` |

Limit scans to the relevant files before widening. A native CSS class can be valid
without producing a Master-generated rule. A dynamic fragment such as
`'bg-' + color` is not a complete statically extractable class.

Do not treat a successful tool call as a successful style: read its result and
diagnostics. Preserve unknown native CSS; flag known invalid values. Suggestions
do not override project design-token policy.

## Verify a repair

Keep a recoverable source snapshot and the relevant passing checks before editing.
After a rejected proposal, reread the retained files; rejected diffs and earlier
reports do not describe the current implementation. Preserve the user's intended
behavior and scope rather than redesigning unrelated styles to clear diagnostics.

### Separate lint coverage from class evidence

Read lint's `coverage.status`, `coverage.checkedFiles`, `summary.checkedFiles` and
`summary.filesWithDiagnostics`. The diagnostic `files` array can be empty when
inputs were checked successfully. Manifest stylesheet entries are not lint inputs.
Selected files and enabled rules do not establish whole-project coverage; no-input
and blocked runs are not successful source checks.

Default lint permits unknown authored CSS names. A clean result or class-order
autofix cannot prove a replacement is a registered utility. Inspect the final
markup with the current project stylesheets loaded. For CLI inspection, reconcile
each markup file's `discovered.valid`, `discovered.usedNative` and
`discovered.invalid` with actual class occurrences. These lists can overlap: a
native selector may be invalid as a utility and still be used native CSS.
An explicit `inspect --classes` request reports presence reasons such as
`generated` or `native-css`; an empty `missingCSS.checked` list proves no such
requested check. Check diagnostics as well as the exit status.

Distinguish generated utilities/native declarations, real native selector hooks,
and unresolved or unchecked spellings. Correlate scanner findings with the source;
aggregate candidates can include stylesheet text. Do not dismiss an invalid markup
class as noise, invent a familiar spelling, or add a dummy selector to hide it.
Rerun inspection after the last markup or stylesheet edit, including autofixes.

### Reconcile conflicts and states

For the affected property, compare emitted declarations, selectors, importance,
layer order and conditions with browser computed values when available. Matched
rules are candidates, not automatically winners. A captured value describes the
source and state at capture time; it does not verify a subsequent edit.

Read the project's actual layer order. Master CSS's base stylesheet declares
`theme, base, defaults, components, utilities`. For normal declarations of the
same origin, the later utility layer outranks components before specificity.
Reopening components later does not promote it. Within the same layer, account
for selector specificity and the other cascade factors. Important declarations
reverse layer priority; unlayered normal rules outrank layered normal rules.
Preserve the intended layer contract rather than using importance or broad
unlayered overrides as a shortcut.

A registered utility also used as a conditional native selector hook can still
emit an unconditional utility rule. A hover selector does not restrict that
separate rule. Investigate conflicting-utilities diagnostics against actual CSS;
sorting classes or accepting a removal fix is not evidence that the interaction
is correct.

Check the component's relevant rest, hover, focus, disabled, responsive/theme and
touch states, including previously passing states and unrelated properties. Keep
hover-capability conditions, inherited values and transition timing where they
are part of the intended behavior. Rebuild and rerun the relevant checks on the
final files. If a proposal breaks previously working behavior, restore or correct
it before describing the repair as complete. This skill provides guidance; it
does not implement an automatic browser runner or rollback gate.

### Report the evidence and limits

Briefly connect changed behavior and retained CSS/dependencies to the checks
actually run. Name checked files, states and remaining uncertainty. Keep unresolved
diagnostics from broader checks visible when a narrower run passes, and distinguish
informational unknown values from invalid values. Explain native-hook findings
without presenting them as registered utilities. Separate post-edit predictions
from fresh browser observations; mark missing browser or runtime coverage as
unverified. Respect the agreed validation budget and report remaining failures
instead of continuing indefinitely or implying that a single passing state proves
the whole repair.

## CLI without MCP

Use the project's installed, version-matched `@master/css-cli`, and confirm its
`--help` if commands differ. For declaration suggestions, use `master-css suggest`
as described in [authoring](authoring.md). A `preserved` result exits successfully
and retains the entire CSS block; it is not a conversion success. Known invalid
suggested values produce a nonzero exit status; `unknown` values still need review.
Existing JSON diagnostic commands include:

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
