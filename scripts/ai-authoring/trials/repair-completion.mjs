// Presentation of existing evaluator checks, not a second scorer or CSS validator.
const reportingRequirements = {
  'retained-css-reported': 'Explain which native CSS, reset and token dependencies the final implementation retains and why they are still needed.',
  'retained-css-explained': 'Explain the native CSS retained to preserve declaration order and fallback behavior.',
  'cascade-limit-reported': 'Explain the remaining cascade verification limits of the conversion.',
  'collision-explained': 'Explain the font-size and font-weight collision and the actual resolution.',
  'consumers-reported': 'Report the observed impact on the primary and secondary consumers.',
  'impact-limits': 'Explain the limits of static evidence for dynamic or runtime consumers.'
}

export function repairCompletion({ sourceHash, status, assessment }) {
  const checks = assessment?.checks ?? []
  const classes = checks.find(check => check.id === 'valid-classes')
  return {
    version: 1, sourceHash, checkpointStatus: status,
    classes: {
      status: classes ? classes.pass ? 'passed' : 'failed' : 'unverified',
      unresolved: Array.isArray(classes?.actual) ? classes.actual : [],
      instruction: 'Resolve every listed class against the current project. Replace it with verified syntax, or remove it only after preserving its behavior in native CSS. Do not remove recognized utilities or native selector hooks merely to clear diagnostics. Recheck the edited markup; this list describes the checkpoint, not your next edit. Lint permits unknown authored CSS names by default: zero lint diagnostics does not establish class recognition. Reconcile final inspect evidence before claiming a replacement is registered; disclose any unresolved or unchecked class.'
    },
    requiredReports: checks.filter(check => Object.hasOwn(reportingRequirements, check.id)).map(check => ({
      id: check.id, checkpointPassed: check.pass, requiresFreshAnswer: true, instruction: reportingRequirements[check.id]
    })),
    remainingChecks: checks.filter(check => !check.pass).map(check => ({ id: check.id, kind: check.kind })),
    stateReview: {
      properties: [...new Set(checks.filter(check => !check.pass).flatMap(check => Array.isArray(check.actual) ? check.actual.flatMap(item => typeof item?.property === 'string' ? [item.property] : []) : []))],
      evidence: '.diagnostic-evidence.json',
      instruction: 'Read source-bound computed values, candidate rules, conditions and layerOrder for the affected properties. Candidates are not proven winners. Reconcile conflicts and the emitted CSS with rest, hover, focus, disabled and touch behavior; disclose predictions separately from host-observed values. A registered class or present native rule can still lose in the cascade.'
    },
    verification: 'Build success and matching appearance do not establish completion. The host must recheck class recognition, behavior, reporting and all previously passing checks on this exact proposal. Report only checks actually run; distinguish model-run checks from pending host browser verification.'
  }
}

export const completionInstructions = `
COMPLETION REVIEW: Use the retained checkpoint's completion section as a checklist, including reporting obligations that passed in an earlier answer. Before finishing:
1. Read the current index.html, app.css and repair-feedback.json; correlate every unresolved class with its source occurrence and required behavior. A rejected patch is evidence, not the current workspace.
2. After the repair, inspect the final edited markup again and run the project's class lint and build. Address unresolved spellings without substituting an unconditional value for state-specific behavior. If a class is replaced by native CSS, remove the obsolete spelling only after preserving its behavior. Do not add a dummy selector just to make a name recognized.
3. Reconcile class evidence before concluding: lint checks selected inputs with enabled rules and permits unknown authored CSS names by default. Zero lint diagnostics, a safe sort fix or a successful build does not prove a class is registered or generates CSS. Run inspect on the actual edited markup inputs with the current project stylesheets loaded; inspect --classes can check specific final spellings. Read each markup file's discovered.valid, discovered.usedNative and discovered.invalid, the missingCSS results when requested, and diagnostics including UNKNOWN_TOKEN. These lists are not mutually exclusive: a native CSS class can appear in invalid (not generated as a utility) and usedNative; confirm its real CSS rule and missingCSS present reason native-css before treating it as unresolved. Aggregate scanner candidates can include non-markup text; correlate findings with actual final class occurrences and source locations. Do not dismiss an invalid markup class as scanner noise or treat missingCSS.checked: [] as validation of every class.
4. For each added/replaced class, distinguish a generated Master utility/native-declaration class from a retained native CSS selector and an unresolved or unchecked spelling. A native selector is not a registered utility; cite its real stylesheet rule and preserve its dependencies and conditions. If inspect contradicts an intended utility, resolve the spelling using current-project evidence or retain the original working class; do not override the diagnostic with familiar Tailwind syntax or lint success. Rerun inspection after any markup or stylesheet edit, including lint --fix. Recognition alone does not prove the winning declaration, layer order, hover capability or browser behavior.
5. Reconcile conflicts and state behavior before declaring a fix. Read the current source files again after a rejection: the rejected diff is not the retained stylesheet. For each affected property, compare the source-bound host computed values and candidate rules in .diagnostic-evidence.json with the current markup, stylesheet and actual built output. Identify selectors, declaration values, importance, layer paths/order and media/state conditions. A matching rule, inspect presence or a familiar class name does not prove which declaration wins; captured rules are candidates and the captured computed value belongs to that checkpoint only.
   Verify the actual declared layer order, not assumptions about the words components or utilities. For normal declarations of the same origin, later layers outrank earlier layers before selector specificity; in the standard theme, base, defaults, components, utilities order, utilities outranks components. Reopening components later does not move that layer, and an ID selector cannot overcome this normal layer priority. Unlayered normal rules outrank layered normal rules. Important declarations reverse layer priority; inline styles, origins, animation/transition and other cascade factors require separate consideration. Do not add !important or move everything unlayered to bypass the problem.
   Treat a conflicting-utilities warning as an unresolved interaction until you inspect the emitted declarations and their conditions. A class also used by a conditional native selector still emits its ordinary utility if registered; putting it on the element can affect rest, focus, disabled and touch unconditionally. A state selector does not restrict that separate utility rule. A zero exit code or safe class-sort fix does not dismiss a conflict. Do not apply a removal fix blindly when both declarations are intentionally needed in different states.
   Before finishing, check the built CSS and final inspect/lint reports after the last edit. Briefly account for rest, hover-capable hover, focus, disabled, touch-rest and touch-tap: what declaration should apply, under which layer and condition, and what evidence supports that expectation. Preserve all previously passing states and unrelated properties. Separate checkpoint observations from predictions about the edited proposal; absent or stale evidence means unverified behavior. Only the host's fresh full checks establish whether the proposal works without regressions.
6. Review every remaining check, including nonvisual requirements. In the final answer briefly connect the actual class changes and state expectations to the final evidence, report remaining diagnostics or missing evidence, explain retained CSS/dependencies and list the checks actually run. State lint scope using coverage.checkedFiles; separate checked-file count from filesWithDiagnostics and do not call selected inputs a whole-project check. An earlier answer's reporting pass does not cover this answer. Do not claim host browser checks have run before they have.
The host still decides adoption using all unchanged task checks and the no-new-regressions gate. Do not edit the evidence or write an answer merely to satisfy a check label.
`
