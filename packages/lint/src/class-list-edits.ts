import {
    parseMasterCSSClassList,
    type MasterCSSClassListItem,
    type MasterCSSClassListParseOptions
} from '@master/css-lexer'
import type { MasterCSS } from '@master/css-engine'
import sortClassNames from './sort-class-names'

export type MasterCSSClassListEditOptions = Pick<MasterCSSClassListParseOptions, 'unescape'>

function parseClassList(classList: string, options: MasterCSSClassListEditOptions = {}) {
    return parseMasterCSSClassList(classList, {
        preserveSpaces: true,
        ...options
    })
}

function cloneClassListItems(items: MasterCSSClassListItem[]) {
    return items.map((item) => ({ ...item }))
}

function buildClassList(items: MasterCSSClassListItem[]) {
    return items.map((item) => item.raw).join('')
}

function removeClassListItemAt(items: MasterCSSClassListItem[], index: number) {
    const previous = items[index - 1]
    const next = items[index + 1]
    if (previous?.type === 'space') {
        items.splice(index - 1, 2)
        return index - 1
    }
    if (next?.type === 'space') {
        items.splice(index, 2)
        return index
    }
    items.splice(index, 1)
    return index
}

function removeClassListToken(items: MasterCSSClassListItem[], token: string) {
    for (let index = 0; index < items.length; index++) {
        const item = items[index]
        if (item.type !== 'class' || item.token !== token) continue
        removeClassListItemAt(items, index)
        return true
    }
    return false
}

function replaceClassListToken(items: MasterCSSClassListItem[], token: string, replacement: string) {
    for (const item of items) {
        if (item.type !== 'class' || item.token !== token) continue
        item.raw = replacement
        item.token = replacement
        item.end = item.start + replacement.length
        return true
    }
    return false
}

function getRawQueuesByToken(items: MasterCSSClassListItem[]) {
    const rawQueues = new Map<string, string[]>()
    for (const item of items) {
        if (item.type !== 'class') continue
        const queue = rawQueues.get(item.token)
        if (queue) {
            queue.push(item.raw)
        } else {
            rawQueues.set(item.token, [item.raw])
        }
    }
    return rawQueues
}

export function sortClassList(classList: string, css: MasterCSS, options: MasterCSSClassListEditOptions = {}) {
    const items = parseClassList(classList, options)
    const classItems = items.filter((item) => item.type === 'class' && item.token)
    if (classItems.length <= 1) return classList

    const sortedTokens = sortClassNames(classItems.map((item) => item.token), css)
    const rawQueues = getRawQueuesByToken(classItems)
    const fixedItems = cloneClassListItems(items)
    let sortedIndex = 0

    for (let index = 0; index < fixedItems.length; index++) {
        const item = fixedItems[index]
        if (item.type !== 'class') continue

        const token = sortedTokens[sortedIndex++]
        if (!token) {
            index = removeClassListItemAt(fixedItems, index) - 1
            continue
        }

        const raw = rawQueues.get(token)?.shift() || token
        item.raw = raw
        item.token = token
    }

    return buildClassList(fixedItems)
}

export function removeClassNamesFromClassList(
    classList: string,
    classNames: string[],
    options: MasterCSSClassListEditOptions = {}
) {
    const items = parseClassList(classList, options)
    for (const className of classNames) {
        removeClassListToken(items, className)
    }
    return buildClassList(items)
}

export function replaceClassNameInClassList(
    classList: string,
    className: string,
    replacement: string,
    options: MasterCSSClassListEditOptions = {}
) {
    const items = parseClassList(classList, options)
    replaceClassListToken(items, className, replacement)
    return buildClassList(items)
}

export function replaceClassGroupInClassList(
    classList: string,
    classNames: string[],
    replacement: string,
    options: MasterCSSClassListEditOptions = {}
) {
    const [firstClassName, ...classNamesToRemove] = classNames
    const items = parseClassList(classList, options)
    if (firstClassName) replaceClassListToken(items, firstClassName, replacement)
    for (const className of classNamesToRemove) {
        removeClassListToken(items, className)
    }
    return buildClassList(items)
}
