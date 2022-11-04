import MasterCSSRule from '../rule'
import MasterCSS from '../css'
import { START_SYMBOL } from '../constants/start-symbol'
import type { MasterCSSDeclaration } from '../rule'

const bracketRegexp = /\{(.*)\}/

export default class extends MasterCSSRule {
    static override id = 'Group'
    static override matches = /^(?:.+?[*_>~+])?\{.+?\}/
    static override unit = ''
    static override prop = ''
    override getThemeProps(declaration: MasterCSSDeclaration, css: MasterCSS): Record<string, Record<string, string>> {
        const themePropsMap: Record<string, Record<string, string>> = {}
        
        const addProp = (themeName: string, propertyName: string) => {
            const indexOfColon = propertyName.indexOf(':')
            if (indexOfColon !== -1) {
                if (!(themeName in themePropsMap)) {
                    themePropsMap[themeName] = {}
                }

                const props = themePropsMap[themeName]
                const name = propertyName.slice(0, indexOfColon)
                if (!(name in props)) {
                    props[name] = propertyName.slice(indexOfColon + 1)
                }
            }
        }
        const handleRule = (rule: MasterCSSRule) => {
            const addProps = (themeName: string, cssText: string) => {
                const cssProperties = cssText.slice(CSS.escape(rule.className).length).match(bracketRegexp)[1].split(';')
                for (const eachCssProperty of cssProperties) {
                    addProp(themeName, eachCssProperty)
                }
            }

            if (this.themeName) {
                const currentThemeNative = rule.natives.find(eachNative => eachNative.themeName === this.themeName) ?? rule.natives.find(eachNative => !eachNative.themeName)
                if (currentThemeNative) {
                    addProps(this.themeName, currentThemeNative.text)
                }
            } else {
                for (const eachNative of rule.natives) {
                    addProps(eachNative.themeName, eachNative.text)
                }
            }
        }

        const names = []
        let currentName = ''
        const addName = () => {
            if (currentName) {
                names.push(currentName)
                currentName = ''
            }
        }

        let i = 1;
        (function analyze(end: string) {
            for (; i < declaration.value.length; i++) {
                const char = declaration.value[i]

                if (!end) {
                    if (char === ';') {
                        addName()
                        continue
                    }
                    if (char === '}') {
                        break
                    }
                }

                currentName += char

                if (end === char) {
                    if (end === '\'') {
                        let count = 0
                        for (let j = currentName.length - 2;; j--)  {
                            if (currentName[j] !== '\\') {
                                break
                            }
                            count++
                        }
                        if (count % 2) {
                            continue
                        }
                    }

                    break
                } else if (char in START_SYMBOL && end !== '\'') {
                    i++
                    analyze(START_SYMBOL[char])
                }
            }
        })(undefined)
        addName()
        
        for (const eachName of names) {
            const result = css.findAndNew(eachName)
            if (Array.isArray(result)) {
                for (const eachRule of result) {
                    handleRule(eachRule)
                }
            } else {
                if (result) {
                    handleRule(result)
                } else {
                    addProp(this.themeName ?? '', eachName)
                }
            }
        }

        return themePropsMap
    }
}