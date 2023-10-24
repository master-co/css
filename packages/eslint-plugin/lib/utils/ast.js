'use strict'

const separatorRegEx = /([\t\n\f\r ]+)/

function calleeToString(calleeNode) {
    if (calleeNode.type === 'Identifier') {
        return calleeNode.name
    }
    if (calleeNode.type === 'MemberExpression') {
        return `${calleeNode.object.name}.${calleeNode.property.name}`
    }
}

function extractRangeFromNode(node) {
    if (node.type === 'TextAttribute' && node.name === 'class') {
        return [node.valueSpan.fullStart.offset, node.valueSpan.end.offset]
    }
    switch (node.value.type) {
        case 'JSXExpressionContainer':
            return node.value.expression.range
        default:
            return node.value.range
    }
}

function extractValueFromNode(node) {
    if (node.type === 'TextAttribute' && node.name === 'class') {
        return node.value
    }
    switch (node.value.type) {
        case 'JSXExpressionContainer':
            return node.value.expression.value
        case 'VExpressionContainer':
            switch (node.value.expression.type) {
                case 'ArrayExpression':
                    return node.value.expression.elements
                case 'ObjectExpression':
                    return node.value.expression.properties
            }
            return node.value.expression.value
        default:
            return node.value.value
    }
}

function extractClassnamesFromValue(classStr) {
    if (typeof classStr !== 'string') {
        return { classNames: [], whitespaces: [], headSpace: false, tailSpace: false }
    }
    let parts = classStr.split(separatorRegEx)
    if (parts[0] === '') {
        parts.shift()
    }
    if (parts[parts.length - 1] === '') {
        parts.pop()
    }
    let headSpace = separatorRegEx.test(parts[0])
    let tailSpace = separatorRegEx.test(parts[parts.length - 1])
    const isClass = (_, i) => (headSpace ? i % 2 !== 0 : i % 2 === 0)
    const isNotClass = (_, i) => (headSpace ? i % 2 === 0 : i % 2 !== 0)
    let classNames = parts.filter(isClass)
    let whitespaces = parts.filter(isNotClass)
    return { classNames: classNames, whitespaces: whitespaces, headSpace: headSpace, tailSpace: tailSpace }
}


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
function parseNodeRecursive(rootNode, childNode, cb, skipConditional = false, isolate = false, ignoredKeys = []) {
    // TODO allow vue non litteral
    let originalClassNamesValue
    let classNames
    if (childNode === null) {
        originalClassNamesValue = extractValueFromNode(rootNode);
        ({ classNames } = extractClassnamesFromValue(originalClassNamesValue))
        classNames = [... new Set(classNames)]
        if (classNames.length === 0) {
            // Don't run for empty className
            return
        }
        cb(classNames, rootNode)
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
                break
            case 'TemplateElement':
                originalClassNamesValue = childNode.value.raw
                break
        }
        ({ classNames } = extractClassnamesFromValue(originalClassNamesValue))
        classNames = [...new Set(classNames)]
        if (classNames.length === 0) {
            // Don't run for empty className
            return
        }
        const targetNode = isolate ? null : rootNode
        cb(classNames, targetNode)
    }
}

function getTemplateElementPrefix(text, raw) {
    const idx = text.indexOf(raw)
    if (idx === 0) {
        return ''
    }
    return text.split(raw).shift()
}

function getTemplateElementSuffix(text, raw) {
    if (text.indexOf(raw) === -1) {
        return ''
    }
    return text.split(raw).pop()
}

function getTemplateElementBody(text, prefix, suffix) {
    let arr = text.split(prefix)
    arr.shift()
    let body = arr.join(prefix)
    arr = body.split(suffix)
    arr.pop()
    return arr.join(suffix)
}

function findLoc(text, lines, startLine, endLine) {
    for (let i = startLine; i <= endLine; i++) {
        const sourceCodeLine = lines[i - 1]
        const index = sourceCodeLine.indexOf(text)
        if (index !== -1) {
            return {
                start: {
                    line: i,
                    column: index
                },
                end: {
                    line: i,
                    column: index + text.length
                }
            }
        }
    }
    return null
}

module.exports = {
    calleeToString,
    extractRangeFromNode,
    extractValueFromNode,
    extractClassnamesFromValue,
    getTemplateElementPrefix,
    getTemplateElementSuffix,
    getTemplateElementBody,
    parseNodeRecursive,
    findLoc
}
