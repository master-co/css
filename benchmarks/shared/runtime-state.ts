import type { MasterCSSRuntimeSnapshot } from '@master/css-runtime'

// This function is also embedded into generated benchmark pages. Keep it free of
// module values and closures so every reader uses the same public-state contract.
export function summarizeRuntimeSnapshot(snapshot?: MasterCSSRuntimeSnapshot) {
  const classUtilityNames: string[] = []
  const retainedClassNames: string[] = []
  const retainedRules = new Map<string, string>()
  for (const [name, state] of Object.entries(snapshot?.classRules || {})) {
    if (state.rules.length) classUtilityNames.push(name)
    if (!state.retained) continue
    retainedClassNames.push(name)
    for (const rule of state.rules) retainedRules.set(JSON.stringify([rule.layer, rule.key]), rule.text)
  }
  let runtimeGeneratedRuleCount = 0
  for (const layer of snapshot?.layers || []) runtimeGeneratedRuleCount += layer.ruleCount
  let retainedClassRawBytes = 0
  for (const text of retainedRules.values()) retainedClassRawBytes += new TextEncoder().encode(text).length
  const runtimeStyleText = snapshot?.cssText || ''
  return {
    runtimeAvailable: Boolean(snapshot),
    progressiveAdopted: snapshot?.hydration.state === 'progressive' ? 1 : 0,
    hydrationFailureReason: snapshot?.hydration.failureReason || '',
    runtimeGeneratedRuleCount,
    runtimeStyleRawBytes: new TextEncoder().encode(runtimeStyleText).length,
    runtimeStyleText,
    classCounts: { ...snapshot?.usageCounts },
    classUtilityNames: classUtilityNames.sort(),
    retainedClassNames: retainedClassNames.sort(),
    retainedClassRuleCount: retainedRules.size,
    retainedClassRawBytes
  }
}

export function renderRuntimeSnapshotReader() {
  return `globalThis.__readBenchmarkRuntimeSnapshot = (snapshot = globalThis.masterCSSRuntime?.snapshot()) => (${summarizeRuntimeSnapshot.toString()})(snapshot);`
}

declare global {
  function __readBenchmarkRuntimeSnapshot(snapshot?: MasterCSSRuntimeSnapshot): ReturnType<typeof summarizeRuntimeSnapshot>
}
