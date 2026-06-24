import { generateValidRules } from '@master/css-validator'
import type { MasterCSS } from '@master/css'
import { equalDeclarations, equalVariants } from './rule-signatures'

export interface ClassConflict {
    className: string
    conflicts: string[]
}

export default function findClassConflicts(classNames: string[], css: MasterCSS): ClassConflict[] {
    const validRules = classNames
        .map((className) => generateValidRules(className, css)[0])
        .filter(Boolean)
    const conflicts: ClassConflict[] = []
    for (let i = 0; i < classNames.length; i++) {
        const className = classNames[i]
        const rule = validRules.find((validRule) => validRule.name === className)
        const conflictingClassNames = []
        if (rule) {
            for (let j = 0; j < classNames.length; j++) {
                const compareClassName = classNames[j]
                const compareRule = validRules.find((validRule) => validRule.name === compareClassName)
                if (i !== j && compareRule
                    && equalDeclarations(rule.declarations, compareRule.declarations)
                    && equalVariants(rule, compareRule)
                ) {
                    conflictingClassNames.push(compareClassName)
                }
            }
            if (conflictingClassNames.length > 0) {
                conflicts.push({
                    className,
                    conflicts: conflictingClassNames
                })
            }
        }
    }
    return conflicts
}
