import Layer from '../layer'
import NonLayer from '../non-layer'
import { Rule } from '../rule'
import { SyntaxRule } from '../syntax-rule'
import { AtFeatureComponent, TypeVariable } from '../types/syntax'

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
            if (this.rules.includes(syntaxRule)) return

            let index: number | undefined
            /**
             * 必須按斷點值遞增，並透過索引插入，
             * 以實現響應式先後套用的規則
             * @example <1  <2  <3  ALL  >=1 >=2 >=3
             * @description
             */
            const endIndex = this.rules.length - 1
            const { at, atToken, order, priority } = syntaxRule
            const findIndex = (startIndex: number, stopCheck?: (syntaxRule: SyntaxRule) => any, matchCheck?: (syntaxRule: SyntaxRule) => any) => {
                let i = startIndex
                for (; i <= endIndex; i++) {
                    const eachSyntaxRule = this.rules[i]
                    if (stopCheck?.(eachSyntaxRule))
                        return matchCheck
                            ? -1
                            : i - 1
                    if (matchCheck?.(eachSyntaxRule))
                        return i
                }

                return matchCheck
                    ? -1
                    : i - 1
            }
            let matchStartIndex: number | undefined
            let matchEndIndex: number | undefined
            if (atToken) {
                const mediaStartIndex = this.rules.findIndex(eachSyntaxRule => eachSyntaxRule.at?.media)
                if (mediaStartIndex === -1) {
                    index = endIndex + 1
                } else {
                    const maxWidthFeature = at.media?.find(({ name }: any) => name === 'max-width') as AtFeatureComponent
                    const minWidthFeature = at.media?.find(({ name }: any) => name === 'min-width') as AtFeatureComponent
                    if (maxWidthFeature || minWidthFeature) {
                        const mediaWidthStartIndex = this.rules.findIndex(eachSyntaxRule => eachSyntaxRule.at?.media?.find(({ name }: any) => name === 'max-width' || name === 'min-width'))
                        if (mediaWidthStartIndex === -1) {
                            index = endIndex + 1
                        } else {
                            if (maxWidthFeature && minWidthFeature) {
                                /**
                                 * 範圍越小 ( 越限定 越侷限 ) 越優先，
                                 * 按照範圍 max-width - min-width 遞減排序
                                 * find 第一個所遇到同樣 feature 且範圍值比自己大的 rule，
                                 * 並插入在該 rule 之後，讓自己優先被套用
                                 */
                                if (priority === -1) {
                                    matchStartIndex = findIndex(
                                        mediaWidthStartIndex,
                                        eachSyntaxRule => eachSyntaxRule.priority !== -1,
                                        eachSyntaxRule => eachSyntaxRule.at.media?.find(({ name }: any) => name === 'max-width') && eachSyntaxRule.at.media?.find(({ name }: any) => name === 'min-width')
                                    )
                                    matchEndIndex = findIndex(
                                        mediaWidthStartIndex,
                                        eachSyntaxRule => eachSyntaxRule.priority !== -1
                                    )
                                } else {
                                    matchStartIndex = findIndex(
                                        mediaWidthStartIndex,
                                        undefined,
                                        eachSyntaxRule => eachSyntaxRule.at.media?.find(({ name }: any) => name === 'max-width') && eachSyntaxRule.at.media?.find(({ name }: any) => name === 'min-width') && eachSyntaxRule.priority !== -1
                                    )
                                    matchEndIndex = endIndex
                                }

                                if (matchStartIndex !== -1) {
                                    const range = (maxWidthFeature.value) as number - (minWidthFeature.value as number)

                                    let i = matchEndIndex
                                    const endI = matchStartIndex
                                    matchStartIndex = matchEndIndex + 1
                                    for (; i >= endI; i--) {
                                        const eachSyntaxRule = this.rules[i]
                                        const eachMaxWidthFeature = eachSyntaxRule.at.media?.find(({ name }: any) => name === 'max-width') as AtFeatureComponent
                                        const eachMinWidthFeature = eachSyntaxRule.at.media?.find(({ name }: any) => name === 'min-width') as AtFeatureComponent
                                        if (!eachMaxWidthFeature || !eachMinWidthFeature) {
                                            break
                                        } else {
                                            const eachRange = (eachMaxWidthFeature.value as number) - (eachMinWidthFeature.value as number)
                                            if (eachRange < range) {
                                                matchEndIndex = i - 1
                                            } else if (eachRange === range) {
                                                matchStartIndex = i
                                            } else {
                                                break
                                            }
                                        }
                                    }
                                }
                            } else if (minWidthFeature) {
                                /**
                                 * find 第一個所遇到同樣 feature 且值比自己大的 rule，
                                 * 並插入在該 rule 之後，讓自己優先被套用
                                 */
                                if (priority === -1) {
                                    matchStartIndex = findIndex(
                                        mediaWidthStartIndex,
                                        eachSyntaxRule => eachSyntaxRule.at.media?.find(({ name }: any) => name === 'max-width') && eachSyntaxRule.at.media?.find(({ name }: any) => name === 'min-width') || eachSyntaxRule.priority !== -1,
                                        eachSyntaxRule => !eachSyntaxRule.at.media?.find(({ name }: any) => name === 'max-width') && eachSyntaxRule.at.media?.find(({ name }: any) => name === 'min-width')
                                    )
                                    matchEndIndex = findIndex(
                                        mediaWidthStartIndex,
                                        eachSyntaxRule => eachSyntaxRule.at.media?.find(({ name }: any) => name === 'max-width') && eachSyntaxRule.at.media?.find(({ name }: any) => name === 'min-width') || eachSyntaxRule.priority !== -1
                                    )
                                } else {
                                    matchStartIndex = findIndex(
                                        mediaWidthStartIndex,
                                        eachSyntaxRule => eachSyntaxRule.at.media?.find(({ name }: any) => name === 'max-width') && eachSyntaxRule.at.media?.find(({ name }: any) => name === 'min-width') && eachSyntaxRule.priority !== -1,
                                        eachSyntaxRule => !eachSyntaxRule.at.media?.find(({ name }: any) => name === 'max-width') && eachSyntaxRule.at.media?.find(({ name }: any) => name === 'min-width') && eachSyntaxRule.priority !== -1
                                    )
                                    matchEndIndex = findIndex(
                                        mediaWidthStartIndex,
                                        eachSyntaxRule => eachSyntaxRule.at.media?.find(({ name }: any) => name === 'max-width') && eachSyntaxRule.at.media?.find(({ name }: any) => name === 'min-width') && eachSyntaxRule.priority !== -1
                                    )
                                }

                                if (matchStartIndex !== -1) {
                                    for (let i = matchEndIndex; i >= matchStartIndex; i--) {
                                        const feature = (this.rules[i].at.media?.find(({ name }: any) => name === 'min-width') as AtFeatureComponent)
                                        if (!feature) continue
                                        if (feature.value > minWidthFeature.value) {
                                            matchEndIndex = i - 1
                                        } else if (feature.value < minWidthFeature.value) {
                                            matchStartIndex = i + 1
                                            break
                                        }
                                    }
                                }
                            } else {
                                /**
                                 * find 第一個所遇到同樣 feature 且值比自己大的 rule，
                                 * 並插入在該 rule 之後，讓自己優先被套用
                                 */
                                if (priority === -1) {
                                    matchStartIndex = findIndex(
                                        mediaWidthStartIndex,
                                        eachSyntaxRule => eachSyntaxRule.at.media?.find(({ name }: any) => name === 'min-width') || eachSyntaxRule.priority !== -1,
                                        eachSyntaxRule => eachSyntaxRule.at.media?.find(({ name }: any) => name === 'max-width')
                                    )
                                    matchEndIndex = findIndex(
                                        mediaWidthStartIndex,
                                        eachSyntaxRule => eachSyntaxRule.at.media?.find(({ name }: any) => name === 'min-width') || eachSyntaxRule.priority !== -1
                                    )
                                } else {
                                    matchStartIndex = findIndex(
                                        mediaWidthStartIndex,
                                        eachSyntaxRule => eachSyntaxRule.at.media?.find(({ name }: any) => name === 'min-width') && eachSyntaxRule.priority !== -1,
                                        eachSyntaxRule => eachSyntaxRule.at.media?.find(({ name }: any) => name === 'max-width') && eachSyntaxRule.priority !== -1
                                    )
                                    matchEndIndex = findIndex(
                                        mediaWidthStartIndex,
                                        eachSyntaxRule => eachSyntaxRule.at.media?.find(({ name }: any) => name === 'min-width') && eachSyntaxRule.priority !== -1
                                    )
                                }

                                if (matchStartIndex !== -1) {
                                    for (let i = matchEndIndex; i >= matchStartIndex; i--) {
                                        const feature = (this.rules[i].at.media?.find(({ name }: any) => name === 'max-width') as AtFeatureComponent)
                                        if (!feature) continue
                                        if (feature.value < maxWidthFeature.value) {
                                            matchEndIndex = i - 1
                                        } else if (feature.value > maxWidthFeature.value) {
                                            matchStartIndex = i + 1
                                            break
                                        }
                                    }
                                }
                            }
                        }
                    } else {
                        if (priority === -1) {
                            matchStartIndex = mediaStartIndex
                            matchEndIndex = findIndex(
                                mediaStartIndex,
                                eachSyntaxRule => eachSyntaxRule.at.media?.find(({ name }: any) => name === 'max-width' || name === 'min-width') || eachSyntaxRule.priority !== -1
                            )
                        } else {
                            matchStartIndex = findIndex(
                                mediaStartIndex,
                                eachSyntaxRule => eachSyntaxRule.at.media?.find(({ name }: any) => name === 'max-width' || name === 'min-width'),
                                eachSyntaxRule => eachSyntaxRule.priority !== -1
                            )
                            matchEndIndex = findIndex(
                                mediaStartIndex,
                                eachSyntaxRule => eachSyntaxRule.at.media?.find(({ name }: any) => name === 'max-width' || name === 'min-width')
                            )
                        }
                    }
                }
            } else {
                if (priority === -1) {
                    matchStartIndex = 0
                    matchEndIndex = findIndex(
                        0,
                        eachSyntax => eachSyntax.atToken || eachSyntax.priority !== -1
                    )
                } else {
                    matchStartIndex = findIndex(
                        0,
                        eachSyntax => eachSyntax.atToken,
                        eachSyntax => eachSyntax.priority !== -1
                    )
                    matchEndIndex = findIndex(
                        0,
                        eachSyntax => eachSyntax.atToken
                    )
                }
            }

            if (index === undefined && matchEndIndex !== undefined && matchStartIndex !== undefined) {
                if (matchStartIndex === -1) {
                    index = matchEndIndex + 1
                } else {
                    if (priority === -1) {
                        for (let i = matchStartIndex; i <= matchEndIndex; i++) {
                            const currentSyntaxRule = this.rules[i]
                            if (currentSyntaxRule.order >= order) {
                                index = i
                                break
                            }
                        }
                    } else {
                        for (let i = matchStartIndex; i <= matchEndIndex; i++) {
                            const currentSyntaxRule = this.rules[i]
                            if (currentSyntaxRule.priority < priority) {
                                index = i
                                break
                            } else if (currentSyntaxRule.priority === priority) {
                                if (currentSyntaxRule.order >= order) {
                                    index = i
                                    break
                                }
                            } else {
                                index = i + 1
                            }
                        }
                    }

                    if (index === undefined) {
                        index = matchEndIndex + 1
                    }
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
            if (syntaxRule.variableNames) {
                for (const eachVariableName of syntaxRule.variableNames) {
                    deleteLayerToken(eachVariableName, this.css.themeLayer)
                }
            }
            if (syntaxRule.animationNames) {
                for (const eachKeyframeName of syntaxRule.animationNames) {
                    deleteLayerToken(eachKeyframeName, this.css.animationsNonLayer)
                }
            }
            syntaxRule.definition.delete?.call(syntaxRule, syntaxRule.name)
            return syntaxRule
        }

        insertVariables(syntaxRule: SyntaxRule) {
            if (syntaxRule.variableNames) {
                for (const eachVariableName of syntaxRule.variableNames) {
                    const variable = this.css.variables.get(eachVariableName)
                    if (this.css.themeLayer.rules.find(({ name }) => name === eachVariableName)) {
                        const count = this.css.themeLayer.tokenCounts.get(eachVariableName) || 0
                        this.css.themeLayer.tokenCounts.set(eachVariableName, count + 1)
                    } else {
                        const newRule = new Rule(eachVariableName)
                        const addNative = (mode: string, _variable: TypeVariable) => {
                            let isDefaultMode = false
                            let preifxCssRuleText: string
                            let selectorText: string
                            let endCurlyBracketCount = 1
                            if (mode) {
                                switch (this.css.config.modes?.[mode]) {
                                    case 'media':
                                        selectorText = ':root'
                                        preifxCssRuleText = `@media(prefers-color-scheme:${mode}){${selectorText}`
                                        endCurlyBracketCount++
                                        break
                                    case 'host':
                                        preifxCssRuleText = selectorText = `:host(.${mode})`
                                        if (!variable?.value && this.css.config.defaultMode === mode) {
                                            preifxCssRuleText += ',:host'
                                            isDefaultMode = true
                                        }
                                        break
                                    case 'class':
                                        preifxCssRuleText = selectorText = `.${mode}`
                                        if (!variable?.value && this.css.config.defaultMode === mode) {
                                            preifxCssRuleText += ',:root'
                                            isDefaultMode = true
                                        }
                                        break
                                    default:
                                        return
                                }
                            } else {
                                preifxCssRuleText = selectorText = ':root'
                            }

                            const cssRuleText = `${preifxCssRuleText}{--${eachVariableName}:${String(_variable.value)}${'}'.repeat(endCurlyBracketCount)}`
                            if (isDefaultMode) {
                                newRule.nodes.unshift({
                                    selectorText,
                                    text: cssRuleText
                                })
                            } else {
                                newRule.nodes.push({
                                    text: cssRuleText
                                })
                            }
                        }
                        if (variable?.value !== undefined) {
                            addNative('', variable as any)
                        }
                        if (variable?.modes) {
                            for (const mode in variable.modes) {
                                addNative(mode, variable.modes[mode])
                            }
                        }
                        this.css.themeLayer.insert(newRule)
                        this.css.themeLayer.tokenCounts.set(eachVariableName, 1)
                    }
                }
            }
        }

        insertAnimations(syntaxRule: SyntaxRule) {
            if (syntaxRule.animationNames) {
                for (const eachAnimationName of syntaxRule.animationNames) {
                    if (this.css.animationsNonLayer.rules.find(({ name }) => name === eachAnimationName)) {
                        const count = this.css.animationsNonLayer.tokenCounts.get(eachAnimationName) || 0
                        this.css.animationsNonLayer.tokenCounts.set(eachAnimationName, count + 1)
                    } else {
                        const keyframes = this.css.animations.get(eachAnimationName)
                        if (!keyframes) continue
                        const keyframeText = Object
                            .entries(keyframes)
                            .reduce((acc, [key, variables]) => {
                                const variableText = Object.entries(variables)
                                    .map(([name, value]) => `${name}:${value}`)
                                    .join(';')
                                return acc + `${key}{${variableText}}`
                            }, '')
                        this.css.animationsNonLayer.insert(
                            new Rule(eachAnimationName, [
                                {
                                    text: `@keyframes ${eachAnimationName}{${keyframeText}}`
                                }
                            ])
                        )
                        this.css.animationsNonLayer.tokenCounts.set(eachAnimationName, 1)
                    }
                }
            }
        }
    }
}