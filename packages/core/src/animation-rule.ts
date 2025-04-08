import MasterCSS from './core'
import { AnimationDefinitions } from './types/config'

export default class AnimationRule {
    native?: CSSKeyframeRule

    constructor(
        public readonly name: string,
        public readonly keyframes: AnimationDefinitions,
        public readonly css: MasterCSS,
    ) { }

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
