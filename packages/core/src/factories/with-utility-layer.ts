import AnimationRule from '../animation-rule'
import Layer from '../layer'
import NonLayer from '../non-layer'
import { Rule } from '../rule'
import { Utility } from '../utility'
import compareRulePriority from '../utils/compare-rule-priority'
import VariableRule from '../variable-rule'

export default function withUtilityLayer<TBase extends new (...args: any[]) => Layer>(Base: TBase) {
    return class UtilityLayer extends Base {
        rules: (Utility | Rule)[] = []
        /**
        * normal
        * normal selectors
        * media normal
        * media selectors
        * media width
        * media width selectors
        */
        insert(utility: Utility | Rule) {
            if (this.rules.includes(utility)) return
            if ('valid' in utility && !utility.valid) return
            let index = this.rules.length
            if (utility instanceof Utility) {
                for (let i = 0; i < this.rules.length; i++) {
                    const rule = this.rules[i]
                    if (!(rule instanceof Utility)) continue
                    if (compareRulePriority(utility, rule) < 0) {
                        index = i
                        break
                    }
                }
            }
            super.insert(utility, index)
            this.insertVariables(utility)
            this.insertAnimations(utility)
            return index
        }

        delete(key: string) {
            const utility = super.delete(key) as Utility | Rule | undefined
            if (!utility) return
            const deleteLayerToken = (layerToken: string, layer: Layer | NonLayer) => {
                const count = layer.tokenCounts.get(layerToken) ?? 0
                if (count <= 1) {
                    layer.delete(layerToken)
                    layer.tokenCounts.delete(layerToken)
                } else {
                    layer.tokenCounts.set(layerToken, count - 1)
                }
            }
            if ('variableNames' in utility) utility.variableNames?.forEach((eachVariableName) => {
                deleteLayerToken(eachVariableName, this.css.themeLayer)
            })
            if ('animationNames' in utility) utility.animationNames?.forEach((eachAnimationName) => {
                deleteLayerToken(eachAnimationName, this.css.animationsNonLayer)
            })
            return utility
        }

        insertVariables(utility: Utility | Rule) {
            if (!('variableNames' in utility)) return
            utility.variableNames?.forEach((eachVariableName) => {
                if (this.css.themeLayer.rules.find(({ name }) => name === eachVariableName)) {
                    const count = this.css.themeLayer.tokenCounts.get(eachVariableName) || 0
                    this.css.themeLayer.tokenCounts.set(eachVariableName, count + 1)
                } else {
                    const variable = this.css.variables.get(eachVariableName)
                    if (!variable) return
                    const newRule = new VariableRule(eachVariableName, variable, this.css)
                    this.css.themeLayer.insert(newRule)
                    this.css.themeLayer.tokenCounts.set(eachVariableName, 1)
                }
            })
        }

        insertAnimations(utility: Utility | Rule) {
            if (!('animationNames' in utility)) return
            utility.animationNames?.forEach((eachAnimationName) => {
                if (this.css.animationsNonLayer.rules.find(({ name }) => name === eachAnimationName)) {
                    const count = this.css.animationsNonLayer.tokenCounts.get(eachAnimationName) || 0
                    this.css.animationsNonLayer.tokenCounts.set(eachAnimationName, count + 1)
                } else {
                    const keyframes = this.css.animations.get(eachAnimationName)
                    if (!keyframes) return
                    const newRule = new AnimationRule(eachAnimationName, keyframes, this.css)
                    this.css.animationsNonLayer.insert(newRule)
                    this.css.animationsNonLayer.tokenCounts.set(eachAnimationName, 1)
                }
            })
        }
    }
}
