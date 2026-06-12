import AnimationRule from './animation-rule'
import Layer from './layer'
import NonLayer from './non-layer'
import { Rule } from './rule'
import { Utility } from './utility'
import compareRulePriority from './utils/compare-rule-priority'
import VariableRule from './variable-rule'

function findUtilityInsertIndex(rules: (Utility | Rule)[], utility: Utility) {
    let low = 0
    let high = rules.length

    while (low < high) {
        const mid = (low + high) >> 1
        const rule = rules[mid]
        if (!(rule instanceof Utility)) {
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

function findUtilityInsertIndexLinear(rules: (Utility | Rule)[], utility: Utility) {
    for (let i = 0; i < rules.length; i++) {
        const rule = rules[i]
        if (!(rule instanceof Utility)) continue
        if (compareRulePriority(utility, rule) < 0) {
            return i
        }
    }
    return rules.length
}

export default class UtilityLayer extends Layer {
    rules: (Utility | Rule)[] = []

    insert(utility: Utility | Rule) {
        if (this.get(utility.key)) return
        if ('valid' in utility && !utility.valid) return
        let index = this.rules.length
        if (utility instanceof Utility) {
            index = findUtilityInsertIndex(this.rules, utility)
        }
        const insertedIndex = super.insert(utility, index)
        if (insertedIndex === undefined) return
        this.insertVariables(utility)
        this.insertAnimations(utility)
        return insertedIndex
    }

    delete(key: string) {
        const utility = super.delete(key) as Utility | Rule | undefined
        if (!utility) return
        const deleteLayerToken = (layerToken: string, layer: Layer | NonLayer, visited = new Set<string>()) => {
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

    insertVariables(utility: Utility | Rule) {
        if (!('variableNames' in utility)) return
        const insertVariable = (eachVariableName: string, visited = new Set<string>()) => {
            if (visited.has(eachVariableName)) return
            visited.add(eachVariableName)
            const variable = this.css.variables.get(eachVariableName)
            if (!variable || variable.inline) return
            if (this.css.themeLayer.rules.find(({ name }) => name === eachVariableName) || this.css.isPreloadedVariable(eachVariableName)) {
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

    insertAnimations(utility: Utility | Rule) {
        if (!('animationNames' in utility)) return
        utility.animationNames?.forEach((eachAnimationName) => {
            if (this.css.animationsNonLayer.rules.find(({ name }) => name === eachAnimationName) || this.css.isPreloadedAnimation(eachAnimationName)) {
                const count = this.css.animationsNonLayer.tokenCounts.get(eachAnimationName) || 0
                this.css.animationsNonLayer.tokenCounts.set(eachAnimationName, count + 1)
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
