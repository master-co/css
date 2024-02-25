/* eslint-disable no-cond-assign */
// @ts-expect-error
import { lexer, parse, walk, property as propertyName } from 'css-tree'
import { type SyntaxError } from '../types/syntax-error'

export default function validateCSS(text: string, parseOptions = {
    parseAtrulePrelude: false,
    parseRulePrelude: false,
    parseValue: false,
    parseCustomProperty: false
}) {
    const errors: any[] = []
    const ast = parse(text, {
        ...parseOptions,
        onParseError(error: any) {
            errors.push(error)
        }
    })

    walk(ast, {
        visit: 'Atrule',
        enter(node: any) {
            errors.push(...validateAtrule(node))
        }
    })

    walk(ast, {
        visit: 'Rule',
        enter(node: any) {
            errors.push(...validateRule(node))
        }
    })
    return errors
}


function isTargetError(error: SyntaxError) {
    if (!error) {
        return null
    }

    if (error.name !== 'SyntaxError' &&
        error.name !== 'SyntaxMatchError' &&
        error.name !== 'SyntaxReferenceError') {
        return null
    }

    return error
}

export function validateAtrule(node: { name: any; prelude: any; block: { children: any[] } }) {
    const atrule = node.name
    const errors = []
    let error

    if (error = isTargetError(lexer.checkAtruleName(atrule))) {
        errors.push(Object.assign(error, {
            atrule
        }))

        return errors
    }

    errors.push(...validateAtrulePrelude(
        atrule,
        node.prelude
    ))

    if (node.block && node.block.children) {
        node.block.children.forEach((child: { type: string; property: any; value: any }) => {
            if (child.type === 'Declaration') {
                errors.push(...validateAtruleDescriptor(
                    atrule,
                    child.property,
                    child.value
                ))
            }
        })
    }

    return errors
}

export function validateAtrulePrelude(atrule: string, prelude: any) {
    const errors = []
    let error: SyntaxError | null

    if (error = isTargetError(lexer.checkAtrulePrelude(atrule, prelude))) {
        errors.push(Object.assign(error, {
            atrule
        }))
    } else if (error = isTargetError(lexer.matchAtrulePrelude(atrule, prelude).error)) {
        errors.push(Object.assign(error, {
            atrule,
            ...error.rawMessage === 'Mismatch' &&
            { details: error.message, message: 'Invalid value for `@' + atrule + '` prelude' }
        }))
    }

    return errors
}

export function validateAtruleDescriptor(atrule: any, descriptor: string, value: any) {
    const errors = []
    let error

    if (error = isTargetError(lexer.checkAtruleDescriptorName(atrule, descriptor))) {
        errors.push(Object.assign(error, {
            atrule,
            descriptor
        }))
    } else {
        if (error = isTargetError(lexer.matchAtruleDescriptor(atrule, descriptor, value).error)) {
            errors.push(Object.assign(error, {
                atrule,
                descriptor,
                ...error.rawMessage === 'Mismatch' &&
                { details: error.message, message: 'Invalid value for `' + descriptor + '` descriptor' }
            }))
        }
    }

    return errors
}

export function validateDeclaration(property: string, value: any) {
    const errors: any[] = []
    let error: SyntaxError | null

    if (propertyName(property).custom) {
        return errors
    }

    if (error = isTargetError(lexer.checkPropertyName(property))) {
        errors.push(Object.assign(error, {
            property
        }))
    } else if (error = isTargetError(lexer.matchProperty(property, value).error)) {
        errors.push(Object.assign(error, {
            property,
            ...error.rawMessage === 'Mismatch' &&
            { details: error.message, message: 'Invalid value for `' + property + '` property' }
        }))
    }

    return errors
}

export function validateRule(node: { block: { children: any[] } }) {
    const errors: any[] = []

    if (node.block && node.block.children) {
        node.block.children.forEach((child: { type: string; property: any; value: any }) => {
            if (child.type === 'Declaration') {
                errors.push(...validateDeclaration(
                    child.property,
                    child.value
                ))
            }
        })
    }

    return errors
}