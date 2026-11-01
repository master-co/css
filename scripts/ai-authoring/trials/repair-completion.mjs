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
    verification: 'Build success and matching appearance do not establish completion. The host must recheck class recognition, behavior, reporting and all previously passing checks on this exact proposal. Report only checks actually run; distinguish model-run checks from pending host browser verification.'
  }
}

export const completionInstructions = `
COMPLETION REVIEW: Use the retained checkpoint's completion section as a checklist, including reporting obligations that passed in an earlier answer. Before finishing:
1. Read the current index.html, app.css and repair-feedback.json; correlate every unresolved class with its source occurrence and required behavior. A rejected patch is evidence, not the current workspace.
2. After the repair, inspect the final edited markup again and run the project's class lint and build. Address unresolved spellings without substituting an unconditional value for state-specific behavior. If a class is replaced by native CSS, remove the obsolete spelling only after preserving its behavior. Do not add a dummy selector just to make a name recognized.
3. Reconcile class evidence before concluding: lint checks selected inputs with enabled rules and permits unknown authored CSS names by default. Zero lint diagnostics, a safe sort fix or a successful build does not prove a class is registered or generates CSS. Run inspect on the actual edited markup inputs with the current project stylesheets loaded; inspect --classes can check specific final spellings. Read each markup file's discovered.valid, discovered.usedNative and discovered.invalid, the missingCSS results when requested, and diagnostics including UNKNOWN_TOKEN. These lists are not mutually exclusive: a native CSS class can appear in invalid (not generated as a utility) and usedNative; confirm its real CSS rule and missingCSS present reason native-css before treating it as unresolved. Aggregate scanner candidates can include non-markup text; correlate findings with actual final class occurrences and source locations. Do not dismiss an invalid markup class as scanner noise or treat missingCSS.checked: [] as validation of every class.
4. For each added/replaced class, distinguish a generated Master utility/native-declaration class from a retained native CSS selector and an unresolved or unchecked spelling. A native selector is not a registered utility; cite its real stylesheet rule and preserve its dependencies and conditions. If inspect contradicts an intended utility, resolve the spelling using current-project evidence or retain the original working class; do not override the diagnostic with familiar Tailwind syntax or lint success. Rerun inspection after any markup or stylesheet edit, including lint --fix. Recognition alone does not prove the winning declaration, layer order, hover capability or browser behavior.
5. Review every remaining check, including nonvisual requirements. In the final answer briefly connect the actual class changes to the final inspect evidence, report remaining diagnostics or missing evidence, explain retained CSS/dependencies and list the checks actually run. State lint scope using coverage.checkedFiles; separate checked-file count from filesWithDiagnostics and do not call selected inputs a whole-project check. An earlier answer's reporting pass does not cover this answer. Do not claim host browser checks have run before they have.
The host still decides adoption using all unchanged task checks and the no-new-regressions gate. Do not edit the evidence or write an answer merely to satisfy a check label.
`
