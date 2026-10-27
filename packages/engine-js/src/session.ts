// The engine session: class rules ordered per layer with reference counts, and the
// theme variables those rules reference, as the Rust `EngineSession` (session.rs,
// resources.rs, theme_batch.rs) keeps them.
import { analyzeAnimations, stylesheetDeclarations } from './animation'
import { generateClassRules } from './generate'
import { compareStoredRules, type StoredRule } from './order'
import { pending } from './pending'
import { cssEscape, decodeProgram } from './program'
import { UTILITY_LAYERS, type KeyframeDefinition as ProgramKeyframe, type Program, type SourceReference, type ThemeNode } from './program-model'
import { wellFormed } from './text'
import type {
  EmittedGlobals,
  EngineSession,
  ExecutionState,
  KeyframeDefinition,
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

const sourceShape = ({ file, range, loc }: SourceReference) => ({
  ...file === undefined ? {} : { file },
  range: { start: range.start, end: range.end },
  ...loc ? { loc: { start: { ...loc.start }, end: { ...loc.end } } } : {}
})

/** A keyframe definition as the Rust engine serializes it: absent options, empty lists and `false` are omitted. */
function keyframeDefinitionShape(definition: ProgramKeyframe): KeyframeDefinition {
  return {
    id: definition.id,
    ...definition.ownerId === undefined ? {} : { ownerId: definition.ownerId },
    ...definition.slotId === undefined ? {} : { slotId: definition.slotId },
    ...definition.occurrence === undefined ? {} : { occurrence: definition.occurrence },
    name: definition.name,
    text: definition.text,
    ...definition.resources.length ? { resources: definition.resources.map(({ start, end, value }) => ({ start, end, value })) } : {},
    ...definition.containers.length ? { containers: definition.containers.map(({ id, prelude }) => ({ id, prelude })) } : {},
    ...definition.retained ? { retained: true } : {},
    ...definition.dependencies.length ? { dependencies: [...definition.dependencies] } : {},
    ...definition.source ? { source: sourceShape(definition.source) } : {}
  }
}

class Session implements EngineSession {
  /** Per layer, rules in CSS order. */
  private readonly layers: StoredRule[][] = UTILITY_LAYERS.map(() => [])
  /** Per layer, each rule by key with the number of classes that reference it. */
  private readonly layerRules: Map<string, { rule: StoredRule, count: number }>[] = UTILITY_LAYERS.map(() => new Map())
  private readonly classRules = new Map<string, [layer: number, key: string][]>()
  /** Connected classes in request order, kept even while they generate no rules. */
  private readonly classOrder = new Set<string>()
  private readonly variableCounts = new Map<string, number>()
  /** Counts the host emitted, which removing rules never goes below. */
  private variableFloors = new Map<string, number>()
  private themeVariableNames: string[] = []
  private themeText: string | undefined
  private themeDirty = false
  private batchDepth = 0
  private disposed = false

  constructor(private readonly program: Program, private readonly emittedGlobals: EmittedGlobals) {
    this.initializeVariableResources()
    this.syncThemeText()
  }

  private assertActive() {
    if (this.disposed) throw new EngineError('SESSION_DISPOSED', 'Master CSS engine session has been disposed.')
  }

  private initializeVariableResources() {
    const { emittedGlobals, program } = this
    if (Object.values(emittedGlobals.keyframes ?? {}).some((count) => count > 0) || emittedGlobals.keyframeSlots?.length || emittedGlobals.suppressedKeyframes?.length) {
      pending('J4', 'emitted keyframes')
    }
    for (const [name, count] of Object.entries(emittedGlobals.variables ?? {})) if (count > 0) this.variableCounts.set(name, count)
    if (program.keyframes.some((definition) => definition.retained)) pending('J4', 'retained keyframes')
    for (const name of program.variableOrder) {
      const variable = program.variables.get(name)!
      if (!variable.isStatic) continue
      this.registerVariable(name)
      if (variable.namespace === 'animate') {
        const animation = analyzeAnimations(stylesheetDeclarations(`a{animation:var(--${name})}`), program)
        if (animation.names.length || animation.retainAll) pending('J4', 'keyframe resources')
      }
    }
    this.variableFloors = new Map(this.variableCounts)
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

  private syncThemeText() {
    if (!this.themeDirty) return
    this.themeText = renderTheme(this.program.theme, new Set(this.themeVariableNames)) || undefined
    this.themeDirty = false
  }

  /** Runs an operation and, outermost, prepends the theme rule change it caused. */
  private batch(operation: (mutations: RuleMutation[]) => void): Transition {
    this.assertActive()
    const mutations: RuleMutation[] = []
    this.batchDepth++
    try {
      operation(mutations)
    } catch (error) {
      // Keep the theme consistent; only a successful outermost batch reports its change.
      if (!--this.batchDepth) this.syncThemeText()
      throw error
    }
    this.batchDepth--
    if (!this.batchDepth && this.themeDirty) {
      const previous = this.themeText
      this.syncThemeText()
      if (previous !== this.themeText) {
        const theme: RuleMutation[] = []
        if (previous !== undefined) theme.push({ op: 'delete', target: 'theme', index: 0, key: 'theme:root' })
        if (this.themeText !== undefined) theme.push({ op: 'insert', target: 'theme', index: 0, key: 'theme:root', text: this.themeText })
        mutations.unshift(...theme)
      }
    }
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
      for (const name of rule.ir.variableNames ?? []) this.registerVariable(name)
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
          for (const variableName of rule.ir.variableNames ?? []) this.unregisterVariable(variableName)
        }
        this.classOrder.delete(className)
      }
    })
  }

  registerEmittedGlobals(emittedGlobals: EmittedGlobals): Transition {
    this.assertActive()
    void emittedGlobals
    return pending('J4', 'emitted globals')
  }

  replaceEmittedGlobals(emittedGlobals: EmittedGlobals): Transition {
    this.assertActive()
    void emittedGlobals
    return pending('J4', 'emitted globals')
  }

  refresh(program: Uint8Array, emittedGlobals?: EmittedGlobals): Transition {
    this.assertActive()
    void program
    void emittedGlobals
    return pending('J4', 'refresh')
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
    return this.themeText === undefined ? { variables, keyframes: [] } : { themeText: this.themeText, variables, keyframes: [] }
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
      text
    }
  }

  dispose() {
    for (const rules of this.layers) rules.length = 0
    for (const rules of this.layerRules) rules.clear()
    this.classRules.clear()
    this.classOrder.clear()
    this.variableCounts.clear()
    this.variableFloors.clear()
    this.themeVariableNames = []
    this.themeText = undefined
    this.themeDirty = false
    this.disposed = true
  }
}

export function createEngineSession(program: Uint8Array, emittedGlobals: EmittedGlobals = {}): EngineSession {
  const decoded = decodeProgram(program)
  if (!decoded.ok) throw new EngineError(decoded.error.code, decoded.error.message)
  return new Session(decoded.program, emittedGlobals)
}
