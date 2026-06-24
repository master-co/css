import defineVisitors from '../utils/define-visitors'
import resolveContext from '../utils/resolve-context'
import createRule from '../create-rule'
import settingsSchema from '../settings-schema'
import {
    findClassConflicts,
    findPartialClassConflicts,
    removeClassNamesFromClassList,
    replaceClassNameInClassList
} from '@master/css-lint'

export default createRule({
    name: 'no-conflicting-classes',
    meta: {
        type: 'layout',
        docs: {
            description: 'Disallow conflicting Master CSS classes'
        },
        messages: {
            collisionClass: '{{message}}',
            partialCollisionClass: 'Prefer "{{replacement}}" over "{{actual}}" because "{{conflict}}" overrides part of it.',
        },
        fixable: 'code',
        schema: [settingsSchema]
    },
    defaultOptions: [],
    create(context) {
        const { settings, css } = resolveContext(context)
        return defineVisitors({ context, settings }, (_, { raw, start, end, unescape, classNodes, classValues }) => {
            const conflicts = findClassConflicts(classValues, css)
            if (conflicts.length) {
                const classNamesToRemove = conflicts.map(({ className }) => className)
                const keptClassNames = [...new Set(conflicts.flatMap(({ conflicts }) => conflicts))]
                const formatClassName = (className: string) => `"${className}"`
                const formatClassList = (classNames: string[]) => {
                    if (classNames.length <= 2) return classNames.map(formatClassName).join(' and ')
                    return `${classNames.slice(0, -1).map(formatClassName).join(', ')}, and ${formatClassName(classNames[classNames.length - 1])}`
                }
                const fixedRaw = removeClassNamesFromClassList(raw, classNamesToRemove, { unescape })
                const firstClassNode = classNodes.find((node) => node.value === classNamesToRemove[0])
                context.report({
                    loc: firstClassNode.loc,
                    messageId: 'collisionClass',
                    data: {
                        message: `${formatClassList(classNamesToRemove)} ${classNamesToRemove.length === 1 ? 'is' : 'are'} overridden by ${formatClassList(keptClassNames)}.`,
                    },
                    fix: function (fixer) {
                        return fixer.replaceTextRange([start, end], fixedRaw)
                    }
                })
                return
            }

            const partialConflicts = findPartialClassConflicts(classValues, css)
            if (!partialConflicts.length) return

            let fixedRaw = raw
            for (const conflict of partialConflicts) {
                fixedRaw = replaceClassNameInClassList(fixedRaw, conflict.className, conflict.replacement, { unescape })
            }

            const classNodeQueues = new Map<string, typeof classNodes>()
            for (const classNode of classNodes) {
                const queue = classNodeQueues.get(classNode.value)
                if (queue) {
                    queue.push(classNode)
                } else {
                    classNodeQueues.set(classNode.value, [classNode])
                }
            }

            for (const conflict of partialConflicts) {
                const classNode = classNodeQueues.get(conflict.className)?.shift()
                if (!classNode) continue
                context.report({
                    loc: classNode.loc,
                    messageId: 'partialCollisionClass',
                    data: {
                        actual: conflict.className,
                        replacement: conflict.replacement,
                        conflict: conflict.conflict
                    },
                    fix(fixer) {
                        return fixer.replaceTextRange([start, end], fixedRaw)
                    }
                })
            }
        })
    },
})
