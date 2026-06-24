import defineVisitors from '../utils/define-visitors'
import resolveContext from '../utils/resolve-context'
import createRule from '../create-rule'
import settingsSchema from '../settings-schema'
import { findClassConflicts } from '@master/css-lint'

export default createRule({
    name: 'no-conflicting-classes',
    meta: {
        type: 'layout',
        docs: {
            description: 'Disallow conflicting Master CSS classes'
        },
        messages: {
            collisionClass: '{{message}}',
        },
        fixable: 'code',
        schema: [settingsSchema]
    },
    defaultOptions: [],
    create(context) {
        const { settings, css } = resolveContext(context)
        return defineVisitors({ context, settings }, (node, { raw, start, end, nodes, classNodes, classValues }) => {
            for (const { className, conflicts } of findClassConflicts(classValues, css)) {
                const collisionClassNamesMsg = conflicts.map(x => `"${x}"`).join(' and ')
                const classNode = classNodes.find((node) => node.value === className)
                const fixedNodes = [...nodes]
                const removeCollision = (removedClassNode) => {
                    for (let i = 0; i < fixedNodes.length; i++) {
                        const fixedNode = fixedNodes[i]
                        const target = fixedNode === removedClassNode
                        if (target) {
                            const prev = fixedNodes[i - 1]
                            const isSpaceBefore = prev && prev.type === 'space'
                            fixedNodes.splice(i, 1)
                            if (isSpaceBefore) {
                                fixedNodes.splice(i - 1, 1)
                            }
                        }
                    }
                }
                conflicts.forEach((collisionClass) => {
                    const collisionNode = classNodes.find((node) => node.value === collisionClass)
                    removeCollision(collisionNode)
                })
                const fixedRaw = fixedNodes
                    .map((node) => node.raw)
                    .join('')
                context.report({
                    loc: classNode.loc,
                    messageId: 'collisionClass',
                    data: {
                        message: `"${className}" applies the same declarations as ${collisionClassNamesMsg}.`,
                    },
                    fix: function (fixer) {
                        return fixer.replaceTextRange([start, end], fixedRaw)
                    }
                })
            }
        })
    },
})
