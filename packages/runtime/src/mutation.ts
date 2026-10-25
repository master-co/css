import debugRuntimeMutation from './debuggers/class-count'
import type { MasterCSSRuntimeSnapshot } from './types'

interface RuntimeMutationContext {
  classCounts: Map<string, number>
  isWarm(className: string): boolean
  ensure(classNames: string[]): unknown
  queueAdded(classNames: string[]): void
  queueRemoved(classNames: string[]): void
  cancelAdded(classNames: string[]): void
  debug(): [Document | ShadowRoot, Element, MasterCSSRuntimeSnapshot]
}

function countMutationDelta(deltaCounts: Map<string, number>, classCounts: Map<string, number>) {
  const added: string[] = []
  const removed: string[] = []
  for (const [className, change] of deltaCounts) {
    const current = classCounts.get(className) || 0
    const next = current + change
    if (next > 0) {
      classCounts.set(className, next)
      if (current === 0) added.push(className)
    } else {
      classCounts.delete(className)
      removed.push(className)
    }
  }
  return { added, removed }
}

/** Counts class changes while the engine is deferred; returns newly connected classes. */
export function applyDeferredMutationDelta(deltaCounts: Map<string, number>, classCounts: Map<string, number>) {
  return countMutationDelta(deltaCounts, classCounts).added
}

export function applyRuntimeMutationDelta(
  records: MutationRecord[],
  deltaCounts: Map<string, number>,
  context: RuntimeMutationContext
) {
  const { added, removed: removedClassNames } = countMutationDelta(deltaCounts, context.classCounts)
  const warmClassNames = added.filter(className => context.isWarm(className))
  const queuedClassNames = added.filter(className => !context.isWarm(className))
  if (warmClassNames.length) context.ensure(warmClassNames)
  if (queuedClassNames.length) context.queueAdded(queuedClassNames)
  if (removedClassNames.length) {
    context.cancelAdded(removedClassNames)
    context.queueRemoved(removedClassNames)
  }
  if (process.env.NODE_ENV === 'development') {
    const [root, host, snapshot] = context.debug()
    debugRuntimeMutation(records, deltaCounts, root, host, snapshot)
  }
}
