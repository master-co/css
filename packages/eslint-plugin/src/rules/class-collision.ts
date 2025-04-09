import defineVisitors from '../utils/define-visitors'
import resolveContext from '../utils/resolve-context'
import filterCollisionClasses from '../functions/filter-collision-classes'
import createRule from '../create-rule'
import settingsSchema from '../settings-schema'

export default createRule({
    name: 'class-collision-detection',
    meta: {
        type: 'layout',
        docs: {
            description: 'Avoid applying classes with the same declarations'
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
            const collisionClassesRecord = filterCollisionClasses(classValues, css)
            for (const className in collisionClassesRecord) {
                const collisionClasses = collisionClassesRecord[className]
                const collisionClassNamesMsg = collisionClasses.map(x => `"${x}"`).join(' and ')
                const classNode = classNodes.find((node) => node.value === className)
                const fixedNodes = [...nodes]
                const removeCollision = (removedClassNode) => {
                    for (let i = 0; i < fixedNodes.length; i++) {
                        const fixedNode = fixedNodes[i]
                        const target = fixedNode === removedClassNode
                        if (target) {
                            const next = fixedNodes[i + 1]
                            const prev = fixedNodes[i - 1]
                            const isSpaceBefore = prev && prev.type === 'space'
                            fixedNodes.splice(i, 1)
                            if (isSpaceBefore) {
                                fixedNodes.splice(i - 1, 1)
                            }
                        }
                    }
                }
                collisionClasses.forEach((collisionClass) => {
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