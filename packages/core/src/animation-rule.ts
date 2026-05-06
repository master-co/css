import MasterCSS from './core'
import { AnimationDefinitions } from './types/config'
import collectVariableNames from './utils/collect-variable-names'
import type { PropertiesHyphen } from 'csstype'

export default class AnimationRule {
    native?: CSSKeyframeRule
    variableNames?: Set<string>

    constructor(
        public readonly name: string,
        public readonly keyframes: AnimationDefinitions,
        public readonly css: MasterCSS,
    ) {
        for (const declarations of Object.values(keyframes)) {
            const variableNames = collectVariableNames(declarations as PropertiesHyphen, css.variables)
            if (!variableNames) continue
            for (const variableName of variableNames) {
                if (this.variableNames) {
                    this.variableNames.add(variableName)
                } else {
                    this.variableNames = new Set([variableName])
                }
            }
        }
    }

    get key() {
        return this.name
    }

    get text(): string {
        return `@keyframes ${this.name}{` + Object
            .entries(this.keyframes)
            .reduce((acc, [key, variables]) => {
                const variableText = Object.entries(variables)
                    .map(([name, value]) => `${name}:${value}`)
                    .join(';')
                return acc + `${key}{${variableText}}`
            }, '') + '}'
    }
}
