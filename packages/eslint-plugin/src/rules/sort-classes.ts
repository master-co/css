import defineVisitors from '../utils/define-visitors'
import resolveContext from '../utils/resolve-context'
import createRule from '../create-rule'
import settingsSchema from '../settings-schema'
import { sortClassNames } from '@master/css-lint'

export default createRule({
    name: 'sort-classes',
    meta: {
        type: 'layout',
        fixable: 'code',
        docs: {
            description: 'Sort Master CSS classes'
        },
        messages: {
            invalidClassOrder: 'No consistent class order followed.',
        },
        schema: [settingsSchema]
    },
    defaultOptions: [],
    create: function (context) {
        const { settings, css } = resolveContext(context)
        const { sourceCode } = context
        return defineVisitors({ context, settings }, (node, { raw, start, end, nodes, classValueRawMap, classValues }) => {
            if (nodes.length <= 1) return
            let orderedClasses = sortClassNames(classValues, css)
            let orderedRaw = nodes
                .map((eachNode, i) => {
                    if (eachNode.type === 'class') {
                        const value = orderedClasses.shift()
                        return classValueRawMap.get(value)
                    }
                    if (eachNode.type === 'space' && (orderedClasses.length !== 0 || i === nodes.length - 1)) {
                        return eachNode.raw
                    }
                    return ''
                })
                .join('')
            if (raw !== orderedRaw) {
                context.report({
                    node,
                    loc: {
                        start: sourceCode.getLocFromIndex(start),
                        end: sourceCode.getLocFromIndex(end),
                    },
                    messageId: 'invalidClassOrder',
                    fix: function (fixer) {
                        return fixer.replaceTextRange([start, end], orderedRaw)
                    }
                })
            }
        })
    },
})
