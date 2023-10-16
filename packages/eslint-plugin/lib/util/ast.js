/**
 * @fileoverview Utility functions for AST
 */

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

module.exports = {
    calleeToString,
    extractRangeFromNode,
    extractValueFromNode,
    extractClassnamesFromValue,
    getTemplateElementPrefix,
    getTemplateElementSuffix,
    getTemplateElementBody,
}
