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

export function applyRuntimeMutationDelta(
  records: MutationRecord[],
  deltaCounts: Map<string, number>,
  context: RuntimeMutationContext
) {
  const warmClassNames: string[] = []
  const queuedClassNames: string[] = []
  const removedClassNames: string[] = []
  for (const [className, change] of deltaCounts) {
    const current = context.classCounts.get(className) || 0
    const next = current + change
    if (next > 0) {
      context.classCounts.set(className, next)
      if (current === 0) {
        if (context.isWarm(className)) warmClassNames.push(className)
        else queuedClassNames.push(className)
      }
    } else {
      context.classCounts.delete(className)
      removedClassNames.push(className)
    }
  }
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
