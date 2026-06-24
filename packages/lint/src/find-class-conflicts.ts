import { generateValidRules } from '@master/css-validator'
import type { MasterCSS } from '@master/css-engine'
import { equalDeclarations, equalVariants } from './rule-signatures'

export interface ClassConflict {
    className: string
    conflicts: string[]
}

export default function findClassConflicts(classNames: string[], css: MasterCSS): ClassConflict[] {
    const validRules = classNames
        .map((className) => {
            const rule = generateValidRules(className, css)[0]
            return rule ? { className, rule } : undefined
        })
        .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
    const conflicts: ClassConflict[] = []
    for (let i = 0; i < validRules.length; i++) {
        const entry = validRules[i]
        const laterConflicts = []
        for (let j = i + 1; j < validRules.length; j++) {
            const compareEntry = validRules[j]
            if (
                equalDeclarations(entry.rule.declarations, compareEntry.rule.declarations)
                && equalVariants(entry.rule, compareEntry.rule)
            ) {
                laterConflicts.push(compareEntry)
            }
        }
        if (!laterConflicts.length) continue
        conflicts.push({
            className: entry.className,
            conflicts: [laterConflicts[laterConflicts.length - 1].className]
        })
    }
    return conflicts
}
