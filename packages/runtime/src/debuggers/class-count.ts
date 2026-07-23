import log from './log'
import type { MasterCSSRuntimeSnapshot } from '../core'

export default function debugRuntimeMutation(
  records: MutationRecord[],
  classCounts: Map<string, number>,
  root: Document | ShadowRoot,
  host: Element,
  snapshot: MasterCSSRuntimeSnapshot
) {
  const actualClassCounts: any = {}
  let errored = false
  const resolveClass = (className: string) => {
    if (Object.prototype.hasOwnProperty.call(actualClassCounts, className)) {
      actualClassCounts[className]++
    } else {
      actualClassCounts[className] = 1
    }
  }
  (root.constructor.name === 'HTMLDocument' ? host : root)
    .querySelectorAll('[class]')
    .forEach((element) => {
      element.classList.forEach(resolveClass)
    })

  host.classList.forEach(resolveClass)

  for (const className in actualClassCounts) {
    const eachCount = snapshot.usageCounts[className]
    const eachActualCount = actualClassCounts[className]
    if (eachCount !== eachActualCount) {
      log.error(`Class count mismatch for \`${className}\` (expected ${eachActualCount}) (received ${eachCount})`)
      errored = true
    }
  }

  for (const [className, eachCount] of Object.entries(snapshot.usageCounts)) {
    if (!Object.prototype.hasOwnProperty.call(actualClassCounts, className)) {
      log.error(`Class count mismatch for \`${className}\` (expected ${0}) (received ${eachCount})`)
      errored = true
    }
  }

  if (errored) {
    log.debug('Records:', records)
    log.debug('Serialized Records:', serializeMutations(records))
    log.debug('Counts:', classCounts)
  }
}

function serializeMutations(mutations: MutationRecord[]) {
  return mutations.map(m => {
    const target = m.target
    return {
      type: m.type,
      attributeName: m.attributeName,
      oldValue: m.oldValue,
      target: {
        tagName: (target as Element).tagName,
        id: (target as Element).id,
        classList: Array.from((target as Element).classList),
      },
      added: Array.from(m.addedNodes)
        .filter(n => n.nodeType === 1)
        .map(el => ({
          tagName: (el as Element).tagName,
          id: (el as Element).id,
          classList: Array.from((el as Element).classList),
        })),
      removed: Array.from(m.removedNodes)
        .filter(n => n.nodeType === 1)
        .map(el => ({
          tagName: (el as Element).tagName,
          id: (el as Element).id,
          classList: Array.from((el as Element).classList),
        })),
    }
  })
}
