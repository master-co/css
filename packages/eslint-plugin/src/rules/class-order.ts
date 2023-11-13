/* eslint-disable no-case-declarations */
import defineVisitors from '../utils/define-visitors'
import resolveContext from '../utils/resolve-context'
import { Rule } from 'eslint'
import getTemplateElementBody from '../utils/get-template-element-body'
import getTemplateElementSuffix from '../utils/get-template-element-suffix'
import getTemplateElementPrefix from '../utils/get-template-element-prefix'
import extractValueFromNode from '../utils/extract-value-from-node'
import extractRangeFromNode from '../utils/extract-range-from-node'
import extractClassnamesFromValue from '../utils/extract-classnames-from-value'
import findLoc from '../utils/find-loc'
import reorderValidClassesAction from '../utils/reorder-valid-classes-action'

export default {
    meta: {
        docs: {
            description: 'Enforce a consistent and logical order of classes',
            category: 'Stylistic Issues',
            recommended: false,
            url: 'https://beta.css.master.co/docs/code-linting#consistent-class-order',
        },
        messages: {
            invalidClassOrder: 'No consistent class order followed.',
        },
        fixable: 'code',
        schema: [
            {
                type: 'object',
                properties: {
                    calleeMatching: {
                        type: 'string'
                    },
                    classMatching: {
                        type: 'string'
                    },
                    ignoredKeys: {
                        type: 'array',
                        items: { type: 'string', minLength: 0 },
                        uniqueItems: true,
                    },
                    config: {
                        type: ['string', 'object'],
                    }
                },
            },
        ],
    },
    create: function (context) {
        const { options, settings } = resolveContext(context)
        const sourceCode = context.sourceCode

        const visitNode = (node, arg = null) => {
            let originalClassNamesValue = null
            let start = null
            let end = null
            let prefix = ''
            let suffix = ''

            let expStrings = []

            if (arg === null) {
                originalClassNamesValue = extractValueFromNode(node)
                const range = extractRangeFromNode(node)
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
                        originalClassNamesValue = sourceCode.getText(arg)
                        originalClassNamesValue = originalClassNamesValue.substring(1, originalClassNamesValue.length - 1)
                        expStrings = originalClassNamesValue.match(/\$\{(?:(?<!\\\\)(['"`]).*?(?<!\\\\)\1|[^}])*?\}/g) ?? []
                        for (let i = 0; i < expStrings.length; i++) {
                            originalClassNamesValue = originalClassNamesValue.replace(expStrings[i], `EXPRESSION_STRING_NUM_${i}`)
                        }
                        start = arg.range[0] + 1
                        end = arg.range[1] - 1
                        break
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
                        const txt = context.sourceCode.getText(arg)

                        prefix = getTemplateElementPrefix(txt, originalClassNamesValue)
                        suffix = getTemplateElementSuffix(txt, originalClassNamesValue)
                        originalClassNamesValue = getTemplateElementBody(txt, prefix, suffix)
                        break
                }
            }

            const { classNames, whitespaces, headSpace, tailSpace } =
                extractClassnamesFromValue(originalClassNamesValue)

            if (classNames.length <= 1) {
                // Don't run sorting for a single or empty className
                return
            }

            let orderedClassNames = reorderValidClassesAction(classNames, settings.config)

            orderedClassNames = classNames.filter(x => !orderedClassNames.includes(x))
                .concat(orderedClassNames)
                .filter(x => x.trim() !== '')

            // Generates the validated/sorted attribute value
            let validatedClassNamesValue = ''
            for (let i = 0; i < orderedClassNames.length; i++) {
                const w = whitespaces[i] ?? ''
                const cls = orderedClassNames[i]
                validatedClassNamesValue += headSpace ? `${w}${cls}` : `${cls}${w}`
                if (cls) {
                    if (!tailSpace && i === orderedClassNames.length - 1) {
                        validatedClassNamesValue = validatedClassNamesValue.replace(/\s+$/, '')
                    }
                    if (headSpace && tailSpace && i === orderedClassNames.length - 1) {
                        validatedClassNamesValue += whitespaces[whitespaces.length - 1] ?? ''
                    }
                }
            }

            for (let i = 0; i < expStrings.length; i++) {
                originalClassNamesValue = originalClassNamesValue.replace(`EXPRESSION_STRING_NUM_${i}`, expStrings[i])
                validatedClassNamesValue = validatedClassNamesValue.replace(`EXPRESSION_STRING_NUM_${i}`, expStrings[i])
            }

            if (originalClassNamesValue !== validatedClassNamesValue) {
                validatedClassNamesValue = prefix + validatedClassNamesValue + suffix

                const sourceCodeLines = sourceCode.lines
                const nodeStartLine = node.loc.start.line
                const nodeEndLine = node.loc.end.line
                const descriptor = {
                    loc: findLoc(originalClassNamesValue, sourceCodeLines, nodeStartLine, nodeEndLine),
                    messageId: 'invalidClassOrder',
                    fix: function (fixer) {
                        return fixer.replaceTextRange([start, end], validatedClassNamesValue)
                    }
                }
                context.report(descriptor)
            }
        }
        return defineVisitors({ context, settings }, visitNode)
    },
} as Rule.RuleModule