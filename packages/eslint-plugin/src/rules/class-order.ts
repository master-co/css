import defineVisitors from '../utils/define-visitors'
import resolveContext from '../utils/resolve-context'
import createRule from '../create-rule'
import settingsSchema from '../settings-schema'
import { sortReadableClasses } from '@master/css'

export default createRule({
    name: 'consistent-class-order',
    meta: {
        type: 'layout',
        fixable: 'code',
        docs: {
            description: 'Enforce a consistent and logical order of classes'
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
            let orderedClasses = sortReadableClasses(classValues, css)
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
                if (node.type === 'TemplateElement') {
                    const first = node.parent.quasis[0] === node
                    const last = node.parent.quasis[node.parent.quasis.length - 1] === node
                    if (first) {
                        orderedRaw = '`' + orderedRaw
                    }
                    if (last) {
                        orderedRaw = orderedRaw + '`'
                    }
                }
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