// The state branches of a class: its selector template, then one branch per custom
// media path, with layer and condition wrappers, as `resolve_state_branches` in the
// engine's state.rs expands them.
import { splitStateToken } from './class-syntax'
import { parseCustomMediaQuery, parseNativeQuery, renderConditionToken, resolveLayerCondition } from './condition'
import { customMediaBranches } from './program'
import type { Program, UtilityLayer } from './program-model'
import { selectorTokenToTemplate, validSelectorStructure } from './selector'

export interface StateBranch {
  key: string
  selectorTemplate?: string
  conditionWrappers: [kind: string, wrapper: string][]
  layer?: UtilityLayer
  important: boolean
}

/** The most branches one class may expand to, as `MAX_STATE_BRANCHES` in the engine's state.rs. */
export const MAX_STATE_BRANCHES = 4096

/** The branches a state token selects; none when any part of it is invalid or unknown. */
export function resolveStateBranches(stateToken: string, inheritedImportant: boolean, program: Program): StateBranch[] {
  let important = inheritedImportant
  if (stateToken[0] === '!') {
    important = true
    stateToken = stateToken.slice(1)
  }
  const [selector, conditions] = splitStateToken(stateToken)
  let branches: StateBranch[] = [{ key: '', conditionWrappers: [], important }]
  if (selector) {
    const template = selectorTokenToTemplate(selector)
    if (!validSelectorStructure(template)) return []
    branches[0].key = selector
    branches[0].selectorTemplate = template
  }
  for (const condition of conditions) {
    let paths = program.customMediaPaths.get(`--${condition}`)
    if (!paths) {
      const query = parseNativeQuery(condition)
      if (query?.kind === 'media' && query.prelude.includes('--')) {
        const media = parseCustomMediaQuery(query.prelude, (name) => program.customMedia.get(name))
        paths = media && customMediaBranches(media)
        if (!paths) return []
      }
    }
    if (paths) {
      const branchPaths = paths
      // Each path multiplies the branches before it; repeated conditions grow exponentially.
      if (branches.length * branchPaths.length > MAX_STATE_BRANCHES) return []
      branches = branches.flatMap((branch) => branchPaths.map((path, index) => ({
        ...branch,
        key: `${branch.key}@${condition}#${index}`,
        conditionWrappers: [...branch.conditionWrappers, ...path.map((query): [string, string] => ['media', `@media ${query}`])]
      })))
      continue
    }
    const layer = resolveLayerCondition(condition)
    if (layer) {
      branches = branches.filter((branch) => !branch.layer || branch.layer === layer)
      for (const branch of branches) {
        branch.key += `@${condition}`
        branch.layer = layer
      }
      continue
    }
    const wrapper = renderConditionToken(condition, program)
    if (!wrapper) return []
    for (const branch of branches) {
      branch.key += `@${condition}`
      branch.conditionWrappers.push(wrapper)
    }
  }
  return branches
}
