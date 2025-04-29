import cssEscape from 'shared/utils/css-escape'
import { SyntaxRule } from '../syntax-rule'
import { VALUE_DELIMITERS } from '../common'

export default function coreGroup(this: SyntaxRule, value: string) {
    const declarations: any = {}
    const addProp = (propertyName: string) => {
        const indexOfColon = propertyName.indexOf(':')
        if (indexOfColon !== -1) {
            const propName = propertyName.slice(0, indexOfColon)
            declarations[propName] = propertyName.slice(indexOfColon + 1)
        }
    }
    const handleRule = (rule: SyntaxRule) => {
        const addProps = (cssText: string) => {
            const cssProperties = cssText.slice(cssEscape(rule.name).length).match(/\{(.*)\}/)?.[1].split(';')
            if (cssProperties)
                for (const eachCssProperty of cssProperties) {
                    addProp(eachCssProperty)
                }
        }

        addProps(rule.text)

        // animation
        if (rule.animationNames) {
            if (!this.animationNames) {
                this.animationNames = new Set()
            }
            for (const eachKeyframeName of rule.animationNames) {
                this.animationNames.add(eachKeyframeName)
            }
        }

        // variable
        if (rule.variableNames) {
            if (this.variableNames) {
                for (const eachVariableName of rule.variableNames) {
                    this.variableNames.add(eachVariableName)
                }
            } else {
                this.variableNames = new Set(rule.variableNames)
            }
        }
    }

    const names: string[] = []
    let currentName = ''
    const addName = () => {
        if (currentName) {
            names.push(currentName.replace(/ /g, '|'))
            currentName = ''
        }
    }

    let i = 1;
    (function analyze(end: string) {
        for (; i < value.length; i++) {
            const char = value[i]

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
                if (end === '\'' || end === '"') {
                    let count = 0
                    for (let j = currentName.length - 2; ; j--) {
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
            } else if (char in VALUE_DELIMITERS && (end !== '\'' && end !== '"')) {
                i++
                analyze(VALUE_DELIMITERS[char as keyof typeof VALUE_DELIMITERS])
            }
        }
    })('')

    addName()

    for (const eachName of names) {
        const rules = this.css.generate(eachName, this.mode)
        if (rules.length) {
            for (const eachRule of rules) {
                handleRule(eachRule)
            }
        } else {
            addProp(eachName)
        }
    }

    return declarations
}