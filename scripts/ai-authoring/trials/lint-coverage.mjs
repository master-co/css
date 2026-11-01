/** Grade explicit report comprehension; prose still needs manual review. */
export function assessLintCoverage(answer, expected) {
  let value
  try { value = JSON.parse(answer) } catch { return { passed: false, failures: ['invalid-json'] } }
  const failures = []
  for (const [key, want] of Object.entries(expected)) {
    const actual = key === 'checkedPaths' && Array.isArray(value?.[key]) ? [...value[key]].sort() : value?.[key]
    const target = Array.isArray(want) ? [...want].sort() : want
    if (JSON.stringify(actual) !== JSON.stringify(target)) failures.push(key)
  }
  if (typeof value?.explanation !== 'string' || !value.explanation.trim()) failures.push('explanation')
  return { passed: !failures.length, failures, answer: value }
}
