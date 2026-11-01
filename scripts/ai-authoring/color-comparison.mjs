export const colorComparisonPolicy = {
  version: 1, space: 'unclamped srgb', channelTolerance: 0.00025, alphaTolerance: 0.002,
  reason: 'Chromium conversion/serialization roundoff and legacy 8-bit alpha rounding; not a perceptual or screenshot equivalence test.'
}

const colorProperties = new Set(['color', 'background-color', 'outline-color'])

// Only parse Chromium's canonical serialization, never authored CSS color syntax.
function channels(value) {
  const match = /^color\(srgb ([^()]+)\)$/.exec(value)
  if (!match) return null
  const [rgb, alpha = '1'] = match[1].split(/\s*\/\s*/)
  const parts = [...rgb.trim().split(/\s+/), alpha]
  if (parts.length !== 4 || parts.some(part => !/^[+-]?(?:\d*\.)?\d+(?:e[+-]?\d+)?$/i.test(part))) return null
  const result = parts.map(Number)
  return result.every(Number.isFinite) ? result : null
}

export async function compareColors(browser, differences) {
  const colors = [...new Set(differences.filter(item => colorProperties.has(item.property))
    .flatMap(item => [item.actual, item.expected]).filter(value => typeof value === 'string'))]
  if (!colors.length) return { differences, equivalent: [], policy: colorComparisonPolicy }
  const context = await browser.newContext()
  let normalized
  try {
    const page = await context.newPage()
    normalized = await page.evaluate(colors => {
      const probe = document.createElement('span')
      document.body.append(probe)
      return Object.fromEntries(colors.map(value => {
        const relative = `color(from ${value} srgb r g b / alpha)`
        // Reject unresolved/context-dependent values rather than borrowing the probe's color.
        if (/currentcolor|var\(|env\(/i.test(value) || !CSS.supports('color', relative)) return [value, null]
        probe.style.color = relative
        return [value, getComputedStyle(probe).color]
      }))
    }, colors)
  } finally { await context.close() }
  const equivalent = [], remaining = []
  for (const item of differences) {
    const actual = channels(normalized[item.actual] ?? ''), expected = channels(normalized[item.expected] ?? '')
    const equal = colorProperties.has(item.property) && actual && expected
      && Math.abs(actual[3] - expected[3]) <= colorComparisonPolicy.alphaTolerance
      && ((actual[3] === 0 && expected[3] === 0) || actual.slice(0, 3).every((value, i) => Math.abs(value - expected[i]) <= colorComparisonPolicy.channelTolerance))
    if (equal) equivalent.push({ ...item, normalizedActual: normalized[item.actual], normalizedExpected: normalized[item.expected] })
    else remaining.push(item)
  }
  return { differences: remaining, equivalent, policy: colorComparisonPolicy }
}
