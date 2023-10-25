
const astUtil = require('../utils/ast')
const defineVisitors = require('../utils/define-visitors')
const resolveContext = require('../utils/resolve-context')
const { createValidRules } = require('@master/css-validator')
const CssTree = require('css-tree')

module.exports = {
    meta: {
        docs: {
            description: 'Avoid declaring the identical CSS property repeatedly',
            category: 'Stylistic Issues',
            recommended: false,
            url: 'https://beta.css.master.co/docs/code-linting#avoid-declaring-the-identical-css-property-repeatedly',
        },
        messages: {
            collisionClass: '{{message}}',
        },
        fixable: 'code'
    },
    create: function (context) {
        const { options, settings, config } = resolveContext(context)
        const visitNode = (node, arg = null) => {
            astUtil.parseNodeRecursive(
                node,
                arg,
                (classNames, node, originalClassNamesValue, start, end) => {
                    const sourceCode = context.getSourceCode()
                    const sourceCodeLines = sourceCode.lines
                    const nodeStartLine = node.loc.start.line
                    const nodeEndLine = node.loc.end.line

                    const parsedRules = classNames
                        .map(x => createValidRules(x, { config }))
                        .map(rules => {
                            if (rules.length) {
                                const ruleAst = CssTree.parse(rules[0].text, { parseValue: false })
                                const ruleStyles = []
                                CssTree.walk(ruleAst, (cssNode) => {
                                    if (cssNode.type === "Declaration") {
                                        ruleStyles.push({
                                            key: cssNode.property,
                                            value: cssNode.value.value
                                        })
                                    }
                                })

                                return {
                                    selector: Object.values(rules[0].vendorSuffixSelectors ?? {})?.[0]?.[0],
                                    mediaToken: rules[0].media?.token,
                                    styles: ruleStyles
                                }
                            }
                            return null
                        })

                    for (let i = 0; i < classNames.length ; i++) {
                        const className = classNames[i]
                        const parsedRule = parsedRules[i]
                        const conflicts = []

                        if (parsedRule && parsedRule.styles.length === 1) {                            
                            for (let j = 0; j < classNames.length; j++) {
                                const compareClassName = classNames[j]
                                const compareRule = parsedRules[j]
                                if (i !== j && compareRule && compareRule.styles.length === 1
                                    && parsedRule.selector == compareRule.selector
                                    && parsedRule.mediaToken == compareRule.mediaToken
                                    && parsedRule.styles[0].key == compareRule.styles[0].key
                                    ) {
                                    conflicts.push(compareClassName)
                                }
                            }

                            if (conflicts.length > 0) {
                                const conflictClassNamesMsg = conflicts.map(x => `\`${x}\``).join(' and ')
                                let fixClassNames = originalClassNamesValue
                                for (const conflictClassName of conflicts){
                                    const regexSafe = conflictClassName.replace(/(\\|\.|\(|\)|\[|\]|\{|\}|\+|\*|\?|\^|\$|\||\/)/g, '\\$1')
                                    fixClassNames = fixClassNames.replace(new RegExp(`\\s+${regexSafe}|${regexSafe}\\s+`), '')
                                }

                                context.report({
                                    loc: astUtil.findLoc(className, sourceCodeLines, nodeStartLine, nodeEndLine),
                                    messageId: 'collisionClass',
                                    data: {
                                        message: `\`${className}\` applies the same CSS declarations as ${conflictClassNamesMsg}.
                                        `,
                                    },
                                    fix: function (fixer) {
                                        return fixer.replaceTextRange([start, end], fixClassNames)
                                    }
                                })
                            }
                        }
                    }
                },
                false,
                false,
                settings.ignoredKeys
            )
        }
        return defineVisitors({ context, options, settings, config }, visitNode)
    },
}
