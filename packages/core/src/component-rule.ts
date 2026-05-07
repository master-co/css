import cssEscape from 'shared/utils/css-escape'
import type { PropertiesHyphen } from 'csstype'
import Layer from './layer'
import MasterCSS from './core'
import { AT_IDENTIFIERS } from './common'
import generateAt from './utils/generate-at'
import parseAt, { AtRuleNode, AtRuleStringNode } from './utils/parse-at'
import collectVariableNames from './utils/collect-variable-names'
import wrapAtRules from './utils/wrap-at-rules'
import type { ComponentLayerName } from './types/config'

function getComponentLayer(css: MasterCSS, layerName: ComponentLayerName) {
    switch (layerName) {
        case 'base':
            return css.baseLayer
        case 'preset':
            return css.presetLayer
        case 'utilities':
            return css.utilitiesLayer
        case 'components':
            return css.componentsLayer
        default:
            throw new Error(`Unsupported component layer: ${layerName}`)
    }
}

export default class ComponentRule {
    native?: CSSRule
    readonly layer: Layer
    readonly atRules?: Record<string, AtRuleNode[]>
    readonly valid: boolean = true
    animationNames?: Set<string>
    variableNames?: Set<string>
    mode?: string

    constructor(
        public readonly name: string,
        public css: MasterCSS,
        public declarations: PropertiesHyphen,
        public selector?: string,
        public atRuleDefinitions?: string[],
        public layerName: ComponentLayerName = 'components',
        public selectorVariant?: string
    ) {
        this.layer = getComponentLayer(css, layerName)
        const atIndex = name.indexOf('@')
        if (atIndex !== -1) {
            const atTokens = name.slice(atIndex + 1).split('@')
            for (const atToken of atTokens) {
                if (!atToken) continue
                if (css.modes.includes(atToken)) {
                    this.mode = atToken
                    continue
                }
                const atRule = parseAt(atToken, css)
                const targetNodes = this.atRules?.[atRule.id]
                if (targetNodes) {
                    targetNodes.push(...atRule.nodes)
                } else {
                    this.atRules = {
                        ...this.atRules,
                        [atRule.id]: atRule.nodes
                    }
                }
            }
        }

        if (this.mode && css.config.modeTrigger === 'media') {
            const atComp = {
                name: 'prefers-color-scheme',
                value: this.mode
            } as AtRuleStringNode
            if (this.atRules?.media) {
                this.atRules.media.push(atComp)
            } else {
                this.atRules = {
                    ...this.atRules,
                    media: [atComp]
                }
            }
        }

        if (!Object.entries(this.declarations).length) {
            this.valid = false
        } else {
            const animationNames = new Set<string>()
            this.variableNames = collectVariableNames(this.declarations, this.css.variables)
            for (const propertyName in this.declarations) {
                const propertyValue = this.declarations[propertyName as keyof PropertiesHyphen]
                if (!propertyValue) continue
                const value = String(propertyValue)
                if (propertyName === 'animation' || propertyName === 'animation-name') {
                    for (const rawValue of value.split(' ')) {
                        if (this.css.animations.has(rawValue)) {
                            animationNames.add(rawValue)
                        }
                    }
                }
            }
            if (animationNames.size) this.animationNames = animationNames
        }
    }

    get text() {
        if (!this.valid) return ''
        const propertiesText: string[] = []
        for (const propertyName in this.declarations) {
            const propertyValue = this.declarations[propertyName as keyof PropertiesHyphen]
            const propertyText = propertyName + ':' + String(propertyValue)
            propertiesText.push(
                propertyText + ((this.css.config.important && !propertyText.endsWith('!important')) ? '!important' : '')
            )
        }
        let text = this.selectorText + '{' + propertiesText.join(';') + '}'
        if (this.atRules !== undefined) {
            AT_IDENTIFIERS.forEach(id => {
                const nodes = this.atRules?.[id]
                if (!nodes) return
                text = generateAt({ id, nodes }) + '{' + text + '}'
            })
        }
        return wrapAtRules(text, this.atRuleDefinitions)
    }

    get selectorText() {
        let pre = ''
        if (this.css.config.scope) {
            pre = this.css.config.scope + ' ' + pre
        }
        if (this.mode) {
            const modeSelector = this.css.getModeSelector(this.mode)
            if (modeSelector) {
                pre = modeSelector + ' ' + pre
            }
        }
        const classSelector = pre + '.' + cssEscape(this.name)
        const base = this.selectorVariant
            ? this.selectorVariant.replace(/&/g, classSelector)
            : classSelector
        return this.selector
            ? this.selector.replace(/&/g, base)
            : base
    }

    get key(): string {
        return [
            this.name,
            '@layer',
            this.layerName,
            this.selector || '&',
            this.selectorVariant || '&',
            JSON.stringify(this.declarations),
            ...(this.atRuleDefinitions || []),
            '@component'
        ].join(' ')
    }
}
