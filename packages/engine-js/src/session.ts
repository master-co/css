// The engine session: class rules ordered per layer with reference counts, and the
// theme variables and keyframes those rules reference, counted over what the host
// already emits, as the Rust `EngineSession` (session.rs, resources.rs, keyframes.rs,
// keyframe_slots.rs, theme_batch.rs) keeps them.
import { declarationAnimationReferences, generateClassRules } from './generate'
import { compareStoredRules, type StoredRule } from './order'
import { cssEscape, decodeProgram } from './program'
import { UTILITY_LAYERS, type KeyframeDefinition as ProgramKeyframe, type Program, type ThemeNode } from './program-model'
import { compareText, wellFormed } from './text'
import type {
  EmittedGlobals,
  EngineSession,
  ExecutionState,
  KeyframeDefinition,
  KeyframeResource,
  Resources,
  RuleMutation,
  Snapshot,
  Transition,
  VariableResource
} from './types'

export const TRANSITION_VERSION = 4

export class EngineError extends Error {
  constructor(readonly code: 'SESSION_DISPOSED' | 'INVALID_PROGRAM' | 'UNSUPPORTED_PROGRAM_VERSION', message: string) {
    super(message)
  }
}

function decode(program: Uint8Array) {
  const decoded = decodeProgram(program)
  if (!decoded.ok) throw new EngineError(decoded.error.code, decoded.error.message)
  return decoded.program
}

/** Emitted globals as the session keeps them; counts of zero stay, as names the host reported. */
interface Globals {
  variables: Map<string, number>
  keyframes: Map<string, number>
  keyframeSlots: string[]
  suppressedKeyframes: string[]
}

const globalsOf = (emitted: EmittedGlobals = {}): Globals => ({
  variables: new Map(Object.entries(emitted.variables ?? {})),
  keyframes: new Map(Object.entries(emitted.keyframes ?? {})),
  keyframeSlots: [...emitted.keyframeSlots ?? []],
  suppressedKeyframes: [...emitted.suppressedKeyframes ?? []]
})

const sameCounts = (left: Map<string, number>, right: Map<string, number>) => left.size === right.size && [...left].every(([name, count]) => right.get(name) === count)
const sameList = (left: readonly unknown[], right: readonly unknown[]) => left.length === right.length && left.every((item, index) => item === right[index])
const sameGlobals = (left: Globals, right: Globals) => sameCounts(left.variables, right.variables) && sameCounts(left.keyframes, right.keyframes)
  && sameList(left.keyframeSlots, right.keyframeSlots) && sameList(left.suppressedKeyframes, right.suppressedKeyframes)

/** Counts are `u32`, which adding saturates. */
const addCount = (count: number, added: number) => Math.min(count + added, 0xffffffff)

function renderTheme(nodes: ThemeNode[], active: Set<string>): string {
  let text = ''
  for (const node of nodes) {
    if (node.type === 'declaration') {
      if (active.has(node.name)) text += `${cssEscape(`--${node.name}`)}:${node.value};`
    } else {
      const body = renderTheme(node.children, active)
      if (body) text += `${node.prelude}{${body}}`
    }
  }
  return text.endsWith(';') ? text.slice(0, -1) : text
}

const containersShape = (containers: ProgramKeyframe['containers']) => containers.map(({ id, prelude }) => ({ id, prelude }))

/** A keyframe definition as the Rust engine serializes it: without its source, and absent options, empty lists and `false` omitted. */
function keyframeDefinitionShape(definition: ProgramKeyframe): KeyframeDefinition {
  return {
    id: definition.id,
    ...definition.ownerId === undefined ? {} : { ownerId: definition.ownerId },
    ...definition.slotId === undefined ? {} : { slotId: definition.slotId },
    ...definition.occurrence === undefined ? {} : { occurrence: definition.occurrence },
    name: definition.name,
    text: definition.text,
    ...definition.resources.length ? { resources: definition.resources.map(({ start, end, value }) => ({ start, end, value })) } : {},
    ...definition.containers.length ? { containers: containersShape(definition.containers) } : {},
    ...definition.retained ? { retained: true } : {},
    ...definition.dependencies.length ? { dependencies: [...definition.dependencies] } : {}
  }
}

/** Where an emitted keyframes rule is placed; a change of any part replaces the rule. */
type KeyframePlacement = [id: string, text: string, anchored: boolean, containers: ProgramKeyframe['containers']]

const samePlacement = (left: KeyframePlacement, right: KeyframePlacement) => left[0] === right[0] && left[1] === right[1] && left[2] === right[2]
  && left[3].length === right[3].length && left[3].every((container, index) => container.id === right[3][index].id && container.prelude === right[3][index].prelude)

class Session implements EngineSession {
  /** Per layer, rules in CSS order. */
  private readonly layers: StoredRule[][] = UTILITY_LAYERS.map(() => [])
  /** Per layer, each rule by key with the number of classes that reference it. */
  private readonly layerRules: Map<string, { rule: StoredRule, count: number }>[] = UTILITY_LAYERS.map(() => new Map())
  private readonly classRules = new Map<string, [layer: number, key: string][]>()
  /** Connected classes in request order, kept even while they generate no rules. */
  private readonly classOrder = new Set<string>()
  private readonly variableCounts = new Map<string, number>()
  private readonly keyframeCounts = new Map<string, number>()
  /** Counts the host emitted, which removing rules never goes below. */
  private variableFloors = new Map<string, number>()
  private keyframeFloors = new Map<string, number>()
  /** The keyframes rules the host has, in order. */
  private keyframeTexts: KeyframePlacement[] = []
  private themeVariableNames: string[] = []
  private themeText: string | undefined
  private themeDirty = false
  private batchDepth = 0
  private disposed = false

  constructor(private program: Program, private globals: Globals) {
    this.initializeResources()
    this.syncThemeText()
    this.syncKeyframes()
  }

  private assertActive() {
    if (this.disposed) throw new EngineError('SESSION_DISPOSED', 'Master CSS engine session has been disposed.')
  }

  private initializeResources() {
    const { globals, program } = this
    for (const [name, count] of globals.variables) if (count > 0) this.variableCounts.set(name, count)
    // Emitted keyframes register their dependencies in name order.
    for (const [id, count] of [...globals.keyframes].sort(([left], [right]) => compareText(left, right))) {
      if (count <= 0 || globals.suppressedKeyframes.includes(id)) continue
      this.keyframeCounts.set(id, count)
      const definition = program.keyframes.find((keyframe) => keyframe.id === id)
      if (definition) this.registerVariables(definition.dependencies)
    }
    for (const definition of program.keyframes) {
      if (globals.suppressedKeyframes.includes(definition.id)) continue
      if (definition.retained && !this.keyframeCounts.has(definition.id)) {
        this.keyframeCounts.set(definition.id, 1)
        this.registerVariables(definition.dependencies)
      }
    }
    for (const name of program.variableOrder) {
      const variable = program.variables.get(name)!
      if (!variable.isStatic) continue
      this.registerVariable(name)
      if (variable.namespace === 'animate') {
        const { names, retainAll } = declarationAnimationReferences(`animation:var(--${name})`, program)
        this.registerKeyframes(names, retainAll)
      }
    }
    this.variableFloors = new Map(this.variableCounts)
    this.keyframeFloors = new Map(this.keyframeCounts)
  }

  /** Counts a variable and, the first time, each dependency it pulls into the theme. */
  private registerVariable(name: string) {
    const visited = new Set<string>()
    const stack = [name]
    while (stack.length) {
      const current = stack.pop()!
      if (visited.has(current)) continue
      visited.add(current)
      const variable = this.program.variables.get(current)
      if (!variable) continue
      for (let index = variable.dependencies.length - 1; index >= 0; index--) stack.push(variable.dependencies[index])
      const count = (this.variableCounts.get(current) ?? 0) + 1
      this.variableCounts.set(current, count)
      if (count === 1) {
        this.themeVariableNames.push(current)
        this.themeDirty = true
      }
    }
  }

  private registerVariables(names: readonly string[]) {
    for (const name of names) this.registerVariable(name)
  }

  private unregisterVariable(name: string) {
    const visited = new Set<string>()
    const stack = [name]
    while (stack.length) {
      const current = stack.pop()!
      if (visited.has(current)) continue
      visited.add(current)
      const variable = this.program.variables.get(current)
      if (!variable) continue
      for (let index = variable.dependencies.length - 1; index >= 0; index--) stack.push(variable.dependencies[index])
      const floor = this.variableFloors.get(current) ?? 0
      const count = this.variableCounts.get(current)
      if (count === undefined || count <= floor) continue
      if (floor === 0 && count === 1) {
        this.variableCounts.delete(current)
        this.themeVariableNames = this.themeVariableNames.filter((variableName) => variableName !== current)
        this.themeDirty = true
      } else {
        this.variableCounts.set(current, count - 1)
      }
    }
  }

  private unregisterVariables(names: readonly string[]) {
    for (const name of names) this.unregisterVariable(name)
  }

  /** The managed keyframes a rule references by name, or all of them; never suppressed ones. */
  private referencedKeyframes(names: readonly string[], all: boolean) {
    if (!all && !names.length) return []
    const { suppressedKeyframes } = this.globals
    return this.program.keyframes.filter((definition) => (all || names.includes(definition.name)) && !suppressedKeyframes.includes(definition.id))
  }

  private registerKeyframes(names: readonly string[] = [], all = false) {
    for (const definition of this.referencedKeyframes(names, all)) {
      const count = addCount(this.keyframeCounts.get(definition.id) ?? 0, 1)
      this.keyframeCounts.set(definition.id, count)
      if (count === 1) this.registerVariables(definition.dependencies)
    }
  }

  private unregisterKeyframes(names: readonly string[] = [], all = false) {
    for (const definition of this.referencedKeyframes(names, all)) {
      const count = this.keyframeCounts.get(definition.id)
      if (count === undefined || count <= (this.keyframeFloors.get(definition.id) ?? 0)) continue
      if (count === 1) {
        this.keyframeCounts.delete(definition.id)
        this.unregisterVariables(definition.dependencies)
      } else {
        this.keyframeCounts.set(definition.id, count - 1)
      }
    }
  }

  /** Keyframes this session emits: referenced, and not emitted by the host. */
  private keyframeResources(): KeyframeResource[] {
    const resources: KeyframeResource[] = []
    for (const definition of this.program.keyframes) {
      const count = this.keyframeCounts.get(definition.id) ?? 0
      if (count <= 0 || (this.globals.keyframes.get(definition.id) ?? 0) !== 0) continue
      const resource: KeyframeResource = { id: definition.id, name: definition.name, text: definition.text, anchored: this.globals.keyframeSlots.includes(definition.id), refCount: count, dependencies: [...definition.dependencies] }
      if (definition.containers.length) resource.containers = containersShape(definition.containers)
      resources.push(resource)
    }
    return resources
  }

  /** The keyframes rule changes since the last sync. */
  private syncKeyframes(): RuleMutation[] {
    const next = this.keyframeResources().map(({ id, text, anchored, containers }): KeyframePlacement => [id, text, anchored, containers ?? []])
    const texts = this.keyframeTexts
    const mutations: RuleMutation[] = []
    for (let index = texts.length - 1; index >= 0; index--) {
      if (next.some((placement) => samePlacement(placement, texts[index]))) continue
      const [[key]] = texts.splice(index, 1)
      mutations.push({ op: 'delete', target: 'keyframes', index, key })
    }
    for (const [index, placement] of next.entries()) {
      if (texts[index] && samePlacement(texts[index], placement)) continue
      const [key, text] = placement
      const previous = texts.findIndex(([id]) => id === key)
      if (previous >= 0) {
        texts.splice(previous, 1)
        mutations.push({ op: 'delete', target: 'keyframes', index: previous, key })
      }
      texts.splice(index, 0, placement)
      mutations.push({ op: 'insert', target: 'keyframes', index, key, text })
    }
    return mutations
  }

  /** Keyframes without a host slot, nested in their native containers. */
  private standaloneKeyframeText() {
    let text = ''
    let path: { id: string, prelude: string }[] = []
    for (const frame of this.keyframeResources()) {
      if (frame.anchored) continue
      const containers = frame.containers ?? []
      let common = 0
      while (common < path.length && common < containers.length && path[common].id === containers[common].id) common++
      text += '}'.repeat(path.length - common)
      for (const container of containers.slice(common)) text += `${container.prelude}{`
      text += frame.text
      path = containers
    }
    return text + '}'.repeat(path.length)
  }

  private syncThemeText() {
    if (!this.themeDirty) return
    this.themeText = renderTheme(this.program.theme, new Set(this.themeVariableNames)) || undefined
    this.themeDirty = false
  }

  /**
   * Runs an operation and, outermost, prepends the theme rule change and appends the
   * keyframes rule changes it caused.
   */
  private batch(operation: (mutations: RuleMutation[]) => void): Transition {
    this.assertActive()
    const mutations: RuleMutation[] = []
    this.batchDepth++
    try {
      operation(mutations)
    } catch (error) {
      // Keep the theme and keyframes consistent; only a successful outermost batch reports their changes.
      if (!--this.batchDepth) {
        this.syncThemeText()
        this.syncKeyframes()
      }
      throw error
    }
    if (--this.batchDepth) return { version: TRANSITION_VERSION, mutations }
    if (this.themeDirty) {
      const previous = this.themeText
      this.syncThemeText()
      if (previous !== this.themeText) {
        const theme: RuleMutation[] = []
        if (previous !== undefined) theme.push({ op: 'delete', target: 'theme', index: 0, key: 'theme:root' })
        if (this.themeText !== undefined) theme.push({ op: 'insert', target: 'theme', index: 0, key: 'theme:root', text: this.themeText })
        mutations.unshift(...theme)
      }
    }
    mutations.push(...this.syncKeyframes())
    return { version: TRANSITION_VERSION, mutations }
  }

  /**
   * Where a rule belongs in its layer. Rules with distinct keys never compare equal,
   * so this is also the index of a stored rule.
   */
  private position(layer: number, rule: StoredRule) {
    const rules = this.layers[layer]
    let low = 0
    let high = rules.length
    while (low < high) {
      const middle = (low + high) >> 1
      if (compareStoredRules(rules[middle], rule) < 0) low = middle + 1
      else high = middle
    }
    return low
  }

  private insertClassRules(className: string, generated: StoredRule[], mutations: RuleMutation[]) {
    const references: [number, string][] = []
    for (const rule of generated) {
      const { key } = rule.ir
      const layer = UTILITY_LAYERS.indexOf(rule.ir.layer)
      references.push([layer, key])
      const stored = this.layerRules[layer].get(key)
      if (stored) {
        stored.count++
        continue
      }
      this.registerVariables(rule.ir.variableNames ?? [])
      this.registerKeyframes(rule.ir.keyframeNames, rule.ir.retainAllKeyframes)
      const index = this.position(layer, rule)
      this.layers[layer].splice(index, 0, rule)
      this.layerRules[layer].set(key, { rule, count: 1 })
      mutations.push({ op: 'insert', target: rule.ir.layer, index, key, text: rule.ir.text, rule: rule.ir })
    }
    this.classOrder.add(className)
    this.classRules.set(className, references)
  }

  ensureClassRules(classNames: readonly string[]) {
    return this.batch((mutations) => {
      for (const name of classNames) {
        const className = wellFormed(name)
        if (!className || this.classRules.has(className)) continue
        this.insertClassRules(className, generateClassRules(className, this.program), mutations)
      }
    })
  }

  deleteClassRules(classNames: readonly string[]) {
    return this.batch((mutations) => {
      for (const name of classNames) {
        const className = wellFormed(name)
        const references = this.classRules.get(className)
        if (!references) continue
        this.classRules.delete(className)
        for (let reference = references.length - 1; reference >= 0; reference--) {
          const [layer, key] = references[reference]
          const stored = this.layerRules[layer].get(key)
          if (!stored) continue
          if (stored.count > 1) {
            stored.count--
            continue
          }
          this.layerRules[layer].delete(key)
          const { rule } = stored
          const rules = this.layers[layer]
          let index = this.position(layer, rule)
          if (rules[index] !== rule) index = rules.indexOf(rule)
          rules.splice(index, 1)
          mutations.push({ op: 'delete', target: UTILITY_LAYERS[layer], index, key })
          this.unregisterVariables(rule.ir.variableNames ?? [])
          this.unregisterKeyframes(rule.ir.keyframeNames, rule.ir.retainAllKeyframes)
        }
        this.classOrder.delete(className)
      }
    })
  }

  /** Re-executes the connected classes against the program and `globals`. */
  private rebuild(globals: Globals) {
    return this.batch((mutations) => {
      const connected = [...this.classOrder]
      for (let layer = this.layers.length - 1; layer >= 0; layer--) {
        const rules = this.layers[layer]
        for (let index = rules.length - 1; index >= 0; index--) mutations.push({ op: 'delete', target: UTILITY_LAYERS[layer], index, key: rules[index].ir.key })
        rules.length = 0
        this.layerRules[layer].clear()
      }
      this.themeDirty = true
      this.variableCounts.clear()
      this.keyframeCounts.clear()
      this.themeVariableNames = []
      this.globals = globals
      this.classRules.clear()
      this.classOrder.clear()
      this.initializeResources()
      mutations.push(...this.ensureClassRules(connected).mutations)
    })
  }

  /** Adds resource counts the host emitted outside this session to the ones it reported before. */
  registerEmittedGlobals(emittedGlobals: EmittedGlobals): Transition {
    this.assertActive()
    const added = globalsOf(emittedGlobals)
    const merged: Globals = {
      variables: new Map(this.globals.variables),
      keyframes: new Map(this.globals.keyframes),
      keyframeSlots: [...this.globals.keyframeSlots],
      suppressedKeyframes: [...this.globals.suppressedKeyframes]
    }
    let changed = false
    for (const id of added.suppressedKeyframes) {
      if (merged.suppressedKeyframes.includes(id)) continue
      merged.suppressedKeyframes.push(id)
      changed = true
    }
    for (const [name, count] of added.variables) {
      if (!count) continue
      const current = merged.variables.get(name) ?? 0
      const next = addCount(current, count)
      if (next === current) continue
      merged.variables.set(name, next)
      changed = true
    }
    for (const [id, count] of added.keyframes) {
      if (count <= 0) continue
      merged.keyframes.set(id, addCount(merged.keyframes.get(id) ?? 0, count))
      changed = true
    }
    for (const id of added.keyframeSlots) {
      if (merged.keyframeSlots.includes(id)) continue
      merged.keyframeSlots.push(id)
      changed = true
    }
    return changed ? this.rebuild(merged) : { version: TRANSITION_VERSION, mutations: [] }
  }

  /** Replaces the host's resource counts with a complete snapshot, as HMR reports it. */
  replaceEmittedGlobals(emittedGlobals: EmittedGlobals): Transition {
    this.assertActive()
    const globals = globalsOf(emittedGlobals)
    return sameGlobals(globals, this.globals) ? { version: TRANSITION_VERSION, mutations: [] } : this.rebuild(globals)
  }

  /** Executes another program, with new emitted globals when given. */
  refresh(program: Uint8Array, emittedGlobals?: EmittedGlobals): Transition {
    this.assertActive()
    this.program = decode(program)
    return this.rebuild(emittedGlobals === undefined ? this.globals : globalsOf(emittedGlobals))
  }

  keyframeDefinitions(): readonly KeyframeDefinition[] {
    this.assertActive()
    return this.program.keyframes.map(keyframeDefinitionShape)
  }

  private resources(): Resources {
    const variables: VariableResource[] = []
    for (const name of this.themeVariableNames) {
      const variable = this.program.variables.get(name)
      if (!variable) continue
      const resource: VariableResource = { name, refCount: this.variableCounts.get(name) ?? 0 }
      if (variable.dependencies.length) resource.dependencies = [...variable.dependencies]
      variables.push(resource)
    }
    const keyframes = this.keyframeResources()
    return this.themeText === undefined ? { variables, keyframes } : { themeText: this.themeText, variables, keyframes }
  }

  executionState(classNames: readonly string[]): ExecutionState {
    this.assertActive()
    return {
      classes: classNames.map((name) => {
        const className = wellFormed(name)
        const references = (this.classRules.get(className) ?? []).map(([layer, key]) => ({ layer: UTILITY_LAYERS[layer], key }))
        return { className, references }
      }),
      resources: this.resources()
    }
  }

  snapshot(): Snapshot {
    this.assertActive()
    let text = this.themeText === undefined ? '' : `@layer theme{${this.themeText}}`
    for (const [index, rules] of this.layers.entries()) {
      if (rules.length) text += `@layer ${UTILITY_LAYERS[index]}{${rules.map((rule) => rule.ir.text).join('')}}`
    }
    return {
      version: TRANSITION_VERSION,
      rules: this.layers.flatMap((rules) => rules.map((rule) => rule.ir)),
      resources: this.resources(),
      text: text + this.standaloneKeyframeText()
    }
  }

  dispose() {
    for (const rules of this.layers) rules.length = 0
    for (const rules of this.layerRules) rules.clear()
    this.classRules.clear()
    this.classOrder.clear()
    this.variableCounts.clear()
    this.keyframeCounts.clear()
    this.variableFloors.clear()
    this.keyframeFloors.clear()
    this.keyframeTexts = []
    this.themeVariableNames = []
    this.themeText = undefined
    this.themeDirty = false
    this.disposed = true
  }
}

export function createEngineSession(program: Uint8Array, emittedGlobals?: EmittedGlobals): EngineSession {
  return new Session(decode(program), globalsOf(emittedGlobals))
}
