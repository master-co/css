import { AnimationRule, compareRulePriority, Rule, VariableRule, type GeneratedRule } from '@master/css-engine'
import RuntimeLayer from './layer'
import type HydratedGeneratedRule from './generated-rule'

type RuntimeGeneratedRule = GeneratedRule | HydratedGeneratedRule

function findUtilityInsertIndex(rules: (RuntimeGeneratedRule | Rule)[], utility: RuntimeGeneratedRule) {
  let low = 0
  let high = rules.length

  while (low < high) {
    const mid = (low + high) >> 1
    const rule = rules[mid]
    if (!('priority' in rule)) {
      return findUtilityInsertIndexLinear(rules, utility)
    }
    if (compareRulePriority(utility, rule) < 0) {
      high = mid
    } else {
      low = mid + 1
    }
  }

  return low
}

function findUtilityInsertIndexLinear(rules: (RuntimeGeneratedRule | Rule)[], utility: RuntimeGeneratedRule) {
  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i]
    if (!('priority' in rule)) continue
    if (compareRulePriority(utility, rule) < 0) {
      return i
    }
  }
  return rules.length
}

export default class RuntimeUtilityLayer extends RuntimeLayer {
  rules: (RuntimeGeneratedRule | Rule)[] = []

  insert(utility: RuntimeGeneratedRule | Rule) {
    if (this.get(utility.key)) return
    if ('valid' in utility && !utility.valid) return
    let index = this.rules.length
    if ('priority' in utility) {
      index = findUtilityInsertIndex(this.rules, utility)
    }
    const insertedIndex = super.insert(utility, index)
    if (insertedIndex === undefined) return
    this.insertVariables(utility)
    this.insertAnimations(utility)
    return insertedIndex
  }

  delete(key: string) {
    const utility = super.delete(key) as RuntimeGeneratedRule | Rule | undefined
    if (!utility) return
    const deleteLayerToken = (layerToken: string, layer: RuntimeLayer | typeof this.css.animationsNonLayer, visited = new Set<string>()) => {
      if (visited.has(layerToken)) return
      visited.add(layerToken)
      const count = layer.tokenCounts.get(layerToken) ?? 0
      const variable = layer === this.css.themeLayer
        ? this.css.variables.get(layerToken)
        : undefined
      if (count <= 1) {
        const deletedRule = layer.delete(layerToken)
        layer.tokenCounts.delete(layerToken)
        variable?.dependencies?.forEach((dependency) => deleteLayerToken(dependency, layer, visited))
        return deletedRule
      } else {
        layer.tokenCounts.set(layerToken, count - 1)
        variable?.dependencies?.forEach((dependency) => deleteLayerToken(dependency, layer, visited))
      }
    }
    if ('variableNames' in utility) utility.variableNames?.forEach((eachVariableName) => {
      deleteLayerToken(eachVariableName, this.css.themeLayer)
    })
    if ('animationNames' in utility) utility.animationNames?.forEach((eachAnimationName) => {
      const deletedAnimationRule = deleteLayerToken(eachAnimationName, this.css.animationsNonLayer)
      const variableNames = deletedAnimationRule && 'variableNames' in deletedAnimationRule
        ? deletedAnimationRule.variableNames as Set<string> | undefined
        : undefined
      if (variableNames) {
        variableNames.forEach((eachVariableName) => {
          deleteLayerToken(eachVariableName, this.css.themeLayer)
        })
      }
    })
    return utility
  }

  insertVariables(utility: RuntimeGeneratedRule | Rule) {
    if (!('variableNames' in utility)) return
    const insertVariable = (eachVariableName: string, visited = new Set<string>()) => {
      if (visited.has(eachVariableName)) return
      visited.add(eachVariableName)
      const variable = this.css.variables.get(eachVariableName)
      if (!variable || variable.inline) return
      if (this.css.themeLayer.rules.find(({ name }) => name === eachVariableName) || this.css.isEmittedGlobalsVariable(eachVariableName)) {
        const count = this.css.themeLayer.tokenCounts.get(eachVariableName) || 0
        this.css.themeLayer.tokenCounts.set(eachVariableName, count + 1)
      } else {
        const newRule = new VariableRule(eachVariableName, variable, this.css)
        this.css.themeLayer.insert(newRule)
        this.css.themeLayer.tokenCounts.set(eachVariableName, 1)
      }
      variable.dependencies?.forEach((dependency) => insertVariable(dependency, visited))
    }
    utility.variableNames?.forEach((eachVariableName) => insertVariable(eachVariableName))
  }

  insertAnimations(utility: RuntimeGeneratedRule | Rule) {
    if (!('animationNames' in utility)) return
    utility.animationNames?.forEach((eachAnimationName) => {
      const animationRule = this.css.animationsNonLayer.rules.find(({ name }) => name === eachAnimationName)
      if (animationRule || this.css.isEmittedGlobalsAnimation(eachAnimationName)) {
        const count = this.css.animationsNonLayer.tokenCounts.get(eachAnimationName) || 0
        this.css.animationsNonLayer.tokenCounts.set(eachAnimationName, count + 1)
        if (animationRule) this.insertVariables(animationRule)
      } else {
        const keyframes = this.css.animations.get(eachAnimationName)
        if (!keyframes) return
        const newRule = new AnimationRule(eachAnimationName, keyframes, this.css)
        this.css.animationsNonLayer.insert(newRule)
        this.css.animationsNonLayer.tokenCounts.set(eachAnimationName, 1)
        this.insertVariables(newRule)
      }
    })
  }
}

export declare type RuntimeUtilityLayerInstance = RuntimeUtilityLayer
