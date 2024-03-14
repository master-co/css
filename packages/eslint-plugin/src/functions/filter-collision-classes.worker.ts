import { runAsWorker } from 'synckit'
import getMasterCSS from './get-css'
import { generateValidRules } from '@master/css-validator'
import { Rule, areRuleStatesEqual } from '@master/css'
import areDeclarationsEqual from '../utils/are-declarations-equal'

export default function runFilterCollisionClasses(classNames: string[], config: string | object): Record<string, string[]> {
    const currentCSS = getMasterCSS(config)
    const validRules = classNames
        .map(eachClassName => generateValidRules(eachClassName, { css: currentCSS })[0])
        .filter(Boolean) as Rule[]
    const collisionClassesRecord: Record<string, string[]> = {}
    for (let i = 0; i < classNames.length; i++) {
        const className = classNames[i]
        const rule = validRules.find((eachValidRule) => eachValidRule.className === className)
        const collisionClasses = []
        if (rule) {
            for (let j = 0; j < classNames.length; j++) {
                const compareClassName = classNames[j]
                const compareRule = validRules.find((eachValidRule) => eachValidRule.className === compareClassName)
                if (i !== j && compareRule
                    && areDeclarationsEqual(rule.declarations, compareRule.declarations)
                    && areRuleStatesEqual(rule, compareRule)
                ) {
                    collisionClasses.push(compareClassName)
                }
            }
            if (collisionClasses.length > 0) {
                collisionClassesRecord[className] = collisionClasses
            }
        }
    }
    return collisionClassesRecord
}

runAsWorker(runFilterCollisionClasses as any)