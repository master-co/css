
const astUtil = require('../utils/ast')
const defineVisitors = require('../utils/define-visitors')
const resolveContext = require('../utils/resolve-context')
const { reorderForReadableClasses } = require('@master/css')

module.exports = {
    meta: {
        docs: {
            description: 'Enforce a consistent and logical order of classes',
            category: 'Stylistic Issues',
            recommended: false,
            url: 'https://beta.css.master.co/docs/code-linting#enforce-a-consistent-and-logical-order-of-classes',
        },
        messages: {
            invalidClassOrder: 'No consistent class order followed.',
        },
        fixable: 'code'
    },
    create: function (context) {
        const { options, settings, config } = resolveContext(context)
        const visitNode = (node, arg = null) => {
            let originalClassNamesValue = null
            let start = null
            let end = null
            let prefix = ''
            let suffix = ''
            if (arg === null) {
                originalClassNamesValue = astUtil.extractValueFromNode(node)
                const range = astUtil.extractRangeFromNode(node)
                if (node.type === 'TextAttribute') {
                    start = range[0]
                    end = range[1]
                } else {
                    start = range[0] + 1
                    end = range[1] - 1
                }
            } else {
                switch (arg.type) {
                    case 'Identifier':
                        return
                    case 'TemplateLiteral':
                        arg.expressions.forEach((exp) => {
                            visitNode(node, exp)
                        })
                        arg.quasis.forEach((quasis) => {
                            visitNode(node, quasis)
                        })
                        return
                    case 'ConditionalExpression':
                        visitNode(node, arg.consequent)
                        visitNode(node, arg.alternate)
                        return
                    case 'LogicalExpression':
                        visitNode(node, arg.right)
                        return
                    case 'ArrayExpression':
                        arg.elements.forEach((el) => {
                            visitNode(node, el)
                        })
                        return
                    case 'ObjectExpression':
                        const isUsedByClassNamesPlugin = node.callee && node.callee.name === 'classnames'
                        const isVue = node.key && node.key.type === 'VDirectiveKey'
                        arg.properties.forEach((prop) => {
                            const propVal = isUsedByClassNamesPlugin || isVue ? prop.key : prop.value
                            visitNode(node, propVal)
                        })
                        return
                    case 'Property':
                        visitNode(node, arg.key)
                        break
                    case 'Literal':
                        originalClassNamesValue = arg.value
                        start = arg.range[0] + 1
                        end = arg.range[1] - 1
                        break
                    case 'SvelteLiteral':
                        originalClassNamesValue = arg.value
                        if (originalClassNamesValue === '') {
                            return
                        }
                        start = arg.range[0]
                        end = arg.range[1]
                        break
                    case 'TemplateElement':
                        originalClassNamesValue = arg.value.raw
                        if (originalClassNamesValue === '') {
                            return
                        }
                        start = arg.range[0]
                        end = arg.range[1]
                        // https://github.com/eslint/eslint/issues/13360
                        // The problem is that range computation includes the backticks (`test`)
                        // but value.raw does not include them, so there is a mismatch.
                        // start/end does not include the backticks, therefore it matches value.raw.
                        const txt = context.getSourceCode().getText(arg)
                        prefix = astUtil.getTemplateElementPrefix(txt, originalClassNamesValue)
                        suffix = astUtil.getTemplateElementSuffix(txt, originalClassNamesValue)
                        originalClassNamesValue = astUtil.getTemplateElementBody(txt, prefix, suffix)
                        break
                }
            }

            let { classNames, whitespaces, headSpace, tailSpace } =
                astUtil.extractClassnamesFromValue(originalClassNamesValue)

            if (classNames.length <= 1) {
                // Don't run sorting for a single or empty className
                return
            }

            let orderedClassNames = reorderForReadableClasses(classNames, config)
                .filter(eachOrderedClassName => classNames.includes(eachOrderedClassName))

            orderedClassNames = classNames.filter(x => !orderedClassNames.includes(x))
                .concat(orderedClassNames)
                .filter(x => x.trim() !== '')

            // Generates the validated/sorted attribute value
            let validatedClassNamesValue = ''
            for (let i = 0; i < orderedClassNames.length; i++) {
                const w = whitespaces[i] ?? ''
                const cls = orderedClassNames[i]
                validatedClassNamesValue += headSpace ? `${w}${cls}` : `${cls}${w}`
                if (headSpace && tailSpace && i === orderedClassNames.length - 1) {
                    validatedClassNamesValue += whitespaces[whitespaces.length - 1] ?? ''
                }
            }

            if (originalClassNamesValue !== validatedClassNamesValue) {
                validatedClassNamesValue = prefix + validatedClassNamesValue + suffix

                const sourceCode = context.getSourceCode()
                const sourceCodeLines = sourceCode.lines
                const nodeStartLine = node.loc.start.line
                const nodeEndLine = node.loc.end.line
                context.report({
                    loc: astUtil.findLoc(originalClassNamesValue, sourceCodeLines, nodeStartLine, nodeEndLine),
                    messageId: 'invalidClassOrder',
                    fix: function (fixer) {
                        return fixer.replaceTextRange([start, end], validatedClassNamesValue)
                    },
                })
            }
        }
        return defineVisitors({ context, options, settings, config }, visitNode)
    },
}
