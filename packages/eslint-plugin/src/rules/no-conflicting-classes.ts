import defineVisitors from '../utils/define-visitors'
import resolveContext from '../utils/resolve-context'
import createRule from '../create-rule'
import settingsSchema from '../settings-schema'
import { findClassConflicts, findPartialClassConflicts } from '@master/css-lint'

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
        return defineVisitors({ context, settings }, (node, { start, end, nodes, classNodes, classValues }) => {
            const conflicts = findClassConflicts(classValues, css)
            if (conflicts.length) {
                const classNamesToRemove = conflicts.map(({ className }) => className)
                const keptClassNames = [...new Set(conflicts.flatMap(({ conflicts }) => conflicts))]
                const formatClassName = (className: string) => `"${className}"`
                const formatClassList = (classNames: string[]) => {
                    if (classNames.length <= 2) return classNames.map(formatClassName).join(' and ')
                    return `${classNames.slice(0, -1).map(formatClassName).join(', ')}, and ${formatClassName(classNames[classNames.length - 1])}`
                }
                const fixedNodes = [...nodes]
                const removeClassName = (className: string) => {
                    for (let i = 0; i < fixedNodes.length; i++) {
                        const fixedNode = fixedNodes[i]
                        const target = fixedNode.type === 'class' && fixedNode.value === className
                        if (!target) continue
                        const prev = fixedNodes[i - 1]
                        const next = fixedNodes[i + 1]
                        const isSpaceBefore = prev && prev.type === 'space'
                        if (isSpaceBefore) {
                            fixedNodes.splice(i, 1)
                            fixedNodes.splice(i - 1, 1)
                        } else if (next && next.type === 'space') {
                            fixedNodes.splice(i, 2)
                        } else {
                            fixedNodes.splice(i, 1)
                        }
                        return
                    }
                }
                classNamesToRemove.forEach(removeClassName)

                const fixedRaw = fixedNodes
                    .map((node) => node.raw)
                    .join('')
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
                        return fixer.replaceTextRange(classNode.range as [number, number], conflict.replacement)
                    }
                })
            }
        })
    },
})
