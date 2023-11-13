import areDeclarationsEqual from '../utils/are-declarations-equal'
import defineVisitors from '../utils/define-visitors'
import resolveContext from '../utils/resolve-context'
import { Rule } from 'eslint'
import findLoc from '../utils/find-loc'
import { parseNodeRecursive } from '../utils/parse-node-recursive'
import validRulesAction from '../utils/valid-rules-action'

export default {
    meta: {
        docs: {
            description: 'Avoid applying classes with the same CSS declaration',
            category: 'Stylistic Issues',
            recommended: false,
            url: 'https://beta.css.master.co/docs/code-linting#class-collision-detection',
        },
        messages: {
            collisionClass: '{{message}}',
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
    create(context) {
        const { options, settings } = resolveContext(context)
        const visitNode = (node, arg = null) => {
            parseNodeRecursive(
                node,
                arg,
                (classNames, node, originalClassNamesValue, start, end) => {
                    const sourceCode = context.sourceCode
                    const sourceCodeLines = sourceCode.lines
                    const nodeStartLine = node.loc.start.line
                    const nodeEndLine = node.loc.end.line
                    const ruleOfClass = validRulesAction(classNames, settings.config)
                    for (let i = 0; i < classNames.length; i++) {
                        const className = classNames[i]
                        const rule = ruleOfClass[className]
                        const conflicts = []
                        if (rule) {
                            for (let j = 0; j < classNames.length; j++) {
                                const compareClassName = classNames[j]
                                const compareRule = ruleOfClass[compareClassName]
                                if (i !== j && compareRule
                                    // 比對兩個 rule 是否具有相同數量及相同屬性的 declarations
                                    && areDeclarationsEqual(rule.declarations, compareRule.declarations)
                                    && rule.stateToken === compareRule.stateToken
                                ) {
                                    conflicts.push(compareClassName)
                                }
                            }
                        }

                        if (conflicts.length > 0) {
                            const conflictClassNamesMsg = conflicts.map(x => `"${x}"`).join(' and ')
                            let fixClassNames = originalClassNamesValue
                            for (const conflictClassName of conflicts) {
                                const regexSafe = conflictClassName.replace(/(\\|\.|\(|\)|\[|\]|\{|\}|\+|\*|\?|\^|\$|\||\/)/g, '\\$1')
                                fixClassNames = fixClassNames.replace(new RegExp(`\\s+${regexSafe}|${regexSafe}\\s+`), '')
                            }
                            context.report({
                                loc: findLoc(className, sourceCodeLines, nodeStartLine, nodeEndLine),
                                messageId: 'collisionClass',
                                data: {
                                    message: `"${className}" applies the same CSS declarations as ${conflictClassNamesMsg}.`,
                                },
                                fix: function (fixer) {
                                    return fixer.replaceTextRange([start, end], fixClassNames)
                                }
                            })
                        }
                    }
                },
                false,
                false,
                settings.ignoredKeys,
                context
            )
        }
        return defineVisitors({ context, settings }, visitNode)
    },
} as Rule.RuleModule