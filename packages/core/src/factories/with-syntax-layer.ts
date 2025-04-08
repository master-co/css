import AnimationRule from '../animation-rule'
import Layer from '../layer'
import NonLayer from '../non-layer'
import { SyntaxRule } from '../syntax-rule'
import compareRulePriority from '../utils/compare-rule-priority'
import VariableRule from '../variable-rule'

export default function withSyntaxLayer<TBase extends new (...args: any[]) => Layer>(Base: TBase) {
    return class SyntaxLayer extends Base {
        rules: SyntaxRule[] = []
        /**
        * normal
        * normal selectors
        * media normal
        * media selectors
        * media width
        * media width selectors
        */
        insert(syntaxRule: SyntaxRule) {
            if (this.rules.includes(syntaxRule) || !syntaxRule.valid) return
            let index = this.rules.length
            for (let i = 0; i < this.rules.length; i++) {
                const rule = this.rules[i]
                if (compareRulePriority(syntaxRule, rule) < 0) {
                    index = i
                    break
                }
            }
            super.insert(syntaxRule, index)
            this.insertVariables(syntaxRule)
            this.insertAnimations(syntaxRule)
            syntaxRule.definition.insert?.call(syntaxRule)
            return index
        }

        delete(key: string) {
            const syntaxRule = super.delete(key) as SyntaxRule | undefined
            if (!syntaxRule) return
            const deleteLayerToken = (layerToken: string, layer: Layer | NonLayer) => {
                const count = layer.tokenCounts.get(layerToken) ?? 0
                if (count <= 1) {
                    layer.delete(layerToken)
                    layer.tokenCounts.delete(layerToken)
                } else {
                    layer.tokenCounts.set(layerToken, count - 1)
                }
            }
            syntaxRule.variableNames?.forEach((eachVariableName) => {
                deleteLayerToken(eachVariableName, this.css.themeLayer)
            })
            syntaxRule.animationNames?.forEach((eachAnimationName) => {
                deleteLayerToken(eachAnimationName, this.css.animationsNonLayer)
            })
            syntaxRule.definition.delete?.call(syntaxRule, syntaxRule.name)
            return syntaxRule
        }

        insertVariables(syntaxRule: SyntaxRule) {
            syntaxRule.variableNames?.forEach((eachVariableName) => {
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

        insertAnimations(syntaxRule: SyntaxRule) {
            syntaxRule.animationNames?.forEach((eachAnimationName) => {
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