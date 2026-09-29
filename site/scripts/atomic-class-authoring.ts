/** Repository authoring policy only. Native CSS and runtime parsing are unchanged. */
import { createToolingSessionSync } from '@master/css-tooling/node'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import preset from '@master/css-preset/default-manifest.json' with { type: 'json' }

export const compositeClassProperties = new Set(`all animation animation-range background border border-block border-block-end border-block-start border-bottom border-image border-inline border-inline-end border-inline-start border-left border-right border-top column-rule columns container flex flex-flow font font-synthesis font-variant grid grid-template line-clamp list-style mask mask-border offset outline scroll-timeline text-decoration text-emphasis text-wrap transition view-timeline white-space -webkit-text-stroke -webkit-mask -webkit-mask-box-image`.split(' '))
const axisProperties = new Set(`background-position background-repeat border-block-color border-block-style border-block-width border-color border-inline-color border-inline-style border-inline-width border-radius border-style border-width contain-intrinsic-size gap grid-area grid-column grid-row inset inset-block inset-inline margin margin-block margin-inline mask-position mask-repeat overflow overscroll-behavior padding padding-block padding-inline place-content place-items place-self scroll-margin scroll-margin-block scroll-margin-inline scroll-padding scroll-padding-block scroll-padding-inline -webkit-mask-position -webkit-mask-repeat`.split(' '))

export function atomicClassIssue(className: string): string | undefined {
  const match = /^([a-z-]+):(.+)$/.exec(className)
  if (!match) return
  const [, property, tail] = match
  if (!compositeClassProperties.has(property) && !axisProperties.has(property)) return
  let depth = 0
  let value = ''
  let quote = ''
  for (let index = 0; index < tail.length; index++) {
    const char = tail[index]
    if (char === '\\') { value += char + (tail[++index] ?? ''); continue }
    if (quote) { if (char === quote) quote = ''; value += char; continue }
    if (char === '"' || char === "'") { quote = char; value += char; continue }
    if (char === '(') depth++
    if (char === ')') depth--
    if (!depth && /[:@!_>+~\[]/.test(char)) break
    value += !depth && (char === '|' || char === '/' || char === ',') ? '\0' : char
  }
  // A single grid line, named area, or span is one placement setting.
  if (property.startsWith('grid-') && !tail.includes('/')) return
  const parts = value.split('\0')
  if (compositeClassProperties.has(property) && parts.length > 1) return `Express independent settings of ${property} separately`
  if (new Set(parts).size > 1) return `Express different edges or axes of ${property} independently`
}

export function createAtomicClassAudit() {
  const session = createToolingSessionSync({ manifest: preset as unknown as MasterCSSManifest })
  return {
    inspect(source: string, languageId: string) {
      const positions = session.analyzeLintDocument(source, languageId).classPositions
      const issues = positions.flatMap(position => {
        const message = atomicClassIssue(position.token)
        return message ? [{ ...position, message }] : []
      })
      const contexts = new Map<string, typeof positions[number][]>()
      for (const position of positions) {
        const key = `${position.contextRange.start}:${position.contextRange.end}`
        const group = contexts.get(key) ?? []
        group.push(position)
        contexts.set(key, group)
      }
      for (const group of contexts.values()) {
        for (const conflict of session.lintClassNames(group.map(item => item.token)).partialConflicts) {
          const position = group.find(item => item.token === conflict.className)!
          issues.push({ ...position, message: `Overlapping class ${conflict.conflict}; express each edge independently` })
        }
      }
      return issues
    },
    dispose: () => session.dispose()
  }
}
