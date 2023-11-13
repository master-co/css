import { Rule } from 'eslint'
import getTemplateElementPrefix from './get-template-element-prefix'
import getTemplateElementSuffix from './get-template-element-suffix'
import extractValueFromNode from './extract-value-from-node'
import extractClassnamesFromValue from './extract-classnames-from-value'
import extractRangeFromNode from './extract-range-from-node'

/**
 * Inspect and parse an abstract syntax node and run a callback function
 *
 * @param {ASTNode} rootNode The current root node being parsed by eslint
 * @param {ASTNode} childNode The AST node child argument being checked
 * @param {Function} cb The callback function
 * @param {Boolean} skipConditional Optional, indicate distinct parsing for conditional nodes
 * @param {Boolean} isolate Optional, set internally to isolate parsing and validation on conditional children
 * @param {Array} ignoredKeys Optional, set object keys which should not be parsed e.g. for `cva`
 * @returns {void}
 */
export function parseNodeRecursive(rootNode, childNode, cb, skipConditional = false, isolate = false, ignoredKeys = [], context: Rule.RuleContext = null) {
    // TODO allow vue non litteral
    let originalClassNamesValue
    let classNames

    let start = null
    let end = null
    let prefix = ''
    let suffix = ''

    if (childNode === null) {
        originalClassNamesValue = extractValueFromNode(rootNode);
        ({ classNames } = extractClassnamesFromValue(originalClassNamesValue))
        classNames = [... new Set(classNames)]
        if (classNames.length === 0) {
            // Don't run for empty className
            return
        }
        const range = extractRangeFromNode(rootNode)
        if (rootNode.type === 'TextAttribute') {
            start = range[0]
            end = range[1]
        } else {
            start = range[0] + 1
            end = range[1] - 1
        }
        cb(classNames, rootNode, originalClassNamesValue, start, end, prefix, suffix)
    } else if (childNode === undefined) {
        // Ignore invalid child candidates (probably inside complex TemplateLiteral)
        return
    } else {
        const forceIsolation = skipConditional ? true : isolate
        let trim = false

        switch (childNode.type) {
            case 'TemplateLiteral':
                childNode.expressions.forEach((exp) => {
                    parseNodeRecursive(rootNode, exp, cb, skipConditional, forceIsolation, ignoredKeys)
                })
                childNode.quasis.forEach((quasis) => {
                    parseNodeRecursive(rootNode, quasis, cb, skipConditional, isolate, ignoredKeys)
                })
                return
            case 'ConditionalExpression':
                parseNodeRecursive(rootNode, childNode.consequent, cb, skipConditional, forceIsolation, ignoredKeys)
                parseNodeRecursive(rootNode, childNode.alternate, cb, skipConditional, forceIsolation, ignoredKeys)
                return
            case 'LogicalExpression':
                parseNodeRecursive(rootNode, childNode.right, cb, skipConditional, forceIsolation, ignoredKeys)
                return
            case 'ArrayExpression':
                childNode.elements.forEach((el) => {
                    parseNodeRecursive(rootNode, el, cb, skipConditional, forceIsolation, ignoredKeys)
                })
                return
            case 'ObjectExpression':
                childNode.properties.forEach((prop) => {
                    const isUsedByClassNamesPlugin = rootNode.callee && rootNode.callee.name === 'classnames'

                    if (prop.type === 'SpreadElement') {
                        // Ignore spread elements
                        return
                    }

                    if (prop.key.type === 'Identifier' && ignoredKeys.includes(prop.key.name)) {
                        // Ignore specific keys defined in settings
                        return
                    }

                    parseNodeRecursive(
                        rootNode,
                        isUsedByClassNamesPlugin ? prop.key : prop.value,
                        cb,
                        skipConditional,
                        forceIsolation,
                        ignoredKeys
                    )
                })
                return
            case 'Property':
                parseNodeRecursive(rootNode, childNode.key, cb, skipConditional, forceIsolation, ignoredKeys)
                return
            case 'Literal':
                trim = true
                originalClassNamesValue = childNode.value
                start = childNode.range[0] + 1
                end = childNode.range[1] - 1
                break
            case 'SvelteLiteral':
                originalClassNamesValue = childNode.value
                start = childNode.range[0]
                end = childNode.range[1]
                break
            case 'TemplateElement':
                originalClassNamesValue = childNode.value.raw
                start = childNode.range[0]
                end = childNode.range[1]
                // eslint-disable-next-line no-case-declarations
                const txt = context?.sourceCode.getText(childNode) ?? ''
                prefix = getTemplateElementPrefix(txt, originalClassNamesValue)
                suffix = getTemplateElementSuffix(txt, originalClassNamesValue)
                break
        }
        ({ classNames } = extractClassnamesFromValue(originalClassNamesValue))
        classNames = [...new Set(classNames)]
        if (classNames.length === 0) {
            // Don't run for empty className
            return
        }
        const targetNode = isolate ? null : rootNode
        cb(classNames, targetNode, originalClassNamesValue, start, end, prefix, suffix)
    }
}