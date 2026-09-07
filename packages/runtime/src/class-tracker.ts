type ClassDeltaMap = Map<string, number>
type ClassCountMap = Map<string, number>

function updateClassDelta(deltaCounts: ClassDeltaMap, className: string, delta: number) {
  const nextDelta = (deltaCounts.get(className) || 0) + delta
  if (nextDelta) {
    deltaCounts.set(className, nextDelta)
  } else {
    deltaCounts.delete(className)
  }
}

function traverseElementSubtree(root: Element, visited: WeakSet<Element>, callback: (el: Element) => void) {
  const stack = [root]
  while (stack.length) {
    const el = stack.pop()!
    if (visited.has(el)) continue
    visited.add(el)
    callback(el)
    for (let child = el.lastElementChild; child; child = child.previousElementSibling) {
      stack.push(child)
    }
  }
}

export default class RuntimeClassTracker {
  private snapshots = new WeakMap<Element, Set<string>>()

  reset() {
    this.snapshots = new WeakMap()
  }

  collectConnected(root: Document | ShadowRoot, classCounts: ClassCountMap) {
    this.reset()
    const connectedNames = new Set<string>()
    for (const el of root.querySelectorAll('[class]')) {
      const classNames = this.snapshotElement(el)
      if (!classNames) continue
      for (const className of classNames) {
        const count = classCounts.get(className) || 0
        if (!count) connectedNames.add(className)
        classCounts.set(className, count + 1)
      }
    }
    return connectedNames
  }

  collectMutations(records: MutationRecord[], root: Document | ShadowRoot) {
    const deltaCounts: ClassDeltaMap = new Map()
    const nodeCounts = new Map<Element, number>()
    const attrRecords = new Set<Element>()
    const visited = new WeakSet<Element>()
    const belongsToRoot = (node: Node) => node.getRootNode() === root

    const updateNodeCount = (el: Element, delta: number) => {
      const nextCount = (nodeCounts.get(el) || 0) + delta
      if (nextCount) {
        nodeCounts.set(el, nextCount)
      } else {
        nodeCounts.delete(el)
      }
    }

    for (const record of records) {
      if (record.type === 'childList') {
        for (const node of record.addedNodes) {
          if (node instanceof Element && belongsToRoot(node)) updateNodeCount(node, 1)
        }
        for (const node of record.removedNodes) {
          if (node instanceof Element && !belongsToRoot(node)) updateNodeCount(node, -1)
        }
      } else if (record.type === 'attributes' && record.attributeName === 'class') {
        const target = record.target
        if (target instanceof Element) attrRecords.add(target)
      }
    }

    for (const [node, count] of nodeCounts) {
      if (count > 0) {
        traverseElementSubtree(node, visited, (el) => this.diffElement(el, deltaCounts))
      } else if (count < 0 && !belongsToRoot(node)) {
        traverseElementSubtree(node, visited, (el) => this.removeElement(el, deltaCounts))
      }
    }

    for (const el of attrRecords) {
      if (visited.has(el)) continue
      if (belongsToRoot(el)) this.diffElement(el, deltaCounts)
      else this.removeElement(el, deltaCounts)
    }

    return deltaCounts
  }

  private snapshotElement(el: Element) {
    const classList = el.classList
    if (!classList.length) {
      this.snapshots.delete(el)
      return
    }
    const classNames = new Set<string>()
    for (let i = 0; i < classList.length; i++) {
      classNames.add(classList.item(i)!)
    }
    this.snapshots.set(el, classNames)
    return classNames
  }

  private diffElement(el: Element, deltaCounts: ClassDeltaMap) {
    const previousClassNames = this.snapshots.get(el)
    const classList = el.classList
    let nextClassNames: Set<string> | undefined

    for (let i = 0; i < classList.length; i++) {
      const className = classList.item(i)!
      if (!previousClassNames?.has(className)) updateClassDelta(deltaCounts, className, 1)
      ;(nextClassNames ??= new Set()).add(className)
    }

    if (previousClassNames) {
      for (const className of previousClassNames) {
        if (!nextClassNames?.has(className)) updateClassDelta(deltaCounts, className, -1)
      }
    }

    if (nextClassNames) {
      this.snapshots.set(el, nextClassNames)
    } else {
      this.snapshots.delete(el)
    }
  }

  private removeElement(el: Element, deltaCounts: ClassDeltaMap) {
    const previousClassNames = this.snapshots.get(el)
    if (!previousClassNames) return
    for (const className of previousClassNames) {
      updateClassDelta(deltaCounts, className, -1)
    }
    this.snapshots.delete(el)
  }
}
