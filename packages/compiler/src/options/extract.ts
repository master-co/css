import MasterCSS, { semantics } from '@master/css'
import type { CompilerSource } from './index'

export default function extract({ content }: CompilerSource, masterCss: MasterCSS) {
    content = preExclude(content)
    const blocks = content.match(/\S+/g) ?? []
    const strings = new Set<string>()
    for (const block of blocks) {
        strings.add(trimString(block))
        const result = peelString(block)
        if (result.size) {
            for (const string of result) {
                strings.add(string)
            }
        }
    }
    return [...strings].filter(x => x && !checkToExclude(x, masterCss))
}

const trimString = (content: string) => {
    const originContent = content

    content = keepCompleteStringAndProcessContent(
        content,
        c => c
            .replace(/^[^:@~()]*(?:["'`]|(?<!@>?)=)/, '')
            .replace(/(?:[([{\\:#=.]+|["'`].*)$/, '')
    )

    if (originContent === content) {
        return content
    } else {
        return trimString(content)
    }
}


const findCompleteString = (content) => {
    const completeStrings = content.match(/((?<!\\)["'`])(?:\\\1|(?:(?!\1))[\S\s])*(?<!\\)\1/g)
    return completeStrings
}

const replaceCompleteString = (content, completeStrings) => {
    completeStrings?.forEach((completeString, index) => {
        content = content.replace(completeString, `COMPLETE-STRING--${index}`)
    })
    return content
}

const keepCompleteStringAndProcessContent = (content: string, process: (content: string) => string) => {
    const completeStrings = findCompleteString(content)
    content = replaceCompleteString(content, completeStrings)
    content = process(content)
    completeStrings?.forEach((completeString, index) => {
        content = content.replace(`COMPLETE-STRING--${index}`, completeString)
    })

    return content
}

const peelString = (content) => {
    const strings = new Set<string>()
    const stringRegx = /((?<!\\)["'`])((?:\\\1|(?:(?!\1))[\S\s])*)((?<!\\)\1)/g
    let m: RegExpExecArray
    while ((m = stringRegx.exec(content)) !== null) {
        if (m.index === stringRegx.lastIndex) {
            stringRegx.lastIndex++
        }
        strings.add(trimString(m[2]))
        const result = peelString(m[2])
        if (result.size) {
            for (const string of result) {
                strings.add(string)
            }
        }
    }
    return strings
}

const preExclude = (content) => {
    return keepCompleteStringAndProcessContent(
        content,
        c => c
            .replace(/\/\*(?:(?!\*\/)[\S\s])*\*\//g, '')
            .replace(/<!--(?:(?!-->)[\S\s])*-->/g, '')
            .replace(/<style[^>]*>(?:(?!<\/style>)[\S\s])*<\/style>/g, '')
            .replace(/import.*from\s*COMPLETE-STRING--\d+/g, '')
            .replace(/import\s*(?:COMPLETE-STRING--\d+|\([^;\s]*\))/g, '')
            .replace(/require\([^;\s]*\)/g, '')
    )
}

const checkToExclude = (content, css: MasterCSS) => {
    const completeStrings = findCompleteString(content)
    const checkContent: string = replaceCompleteString(content, completeStrings)
    const groupRegx = /{(.*)}/
    let m: RegExpExecArray
    while ((m = groupRegx.exec(checkContent)) !== null) {
        const groupClasses = m[1].split(';')
        return groupClasses.find(x => needExclude(x, css)) !== undefined
    }
    return needExclude(checkContent, css)
}

const needExclude = (content, css: MasterCSS) => {
    return !content
        || (
            !content.match(/(?:\S*\{\S*\})|(?:^[\w-]+:\S+)|(?:^[\w-]+\(\S+\)$)|(?:^[@~]\S+$)/)
            && !content.match(/^(?:calc\(.*\)|\d+(?:%|ch|cm|em|ex|in|mm|pc|pt|px|rem|vh|vmax|vmin|vw|deg|grad|rad|turn|s)?)x(?:calc\(.*\)|\d+(?:%|ch|cm|em|ex|in|mm|pc|pt|px|rem|vh|vmax|vmin|vw|deg|grad|rad|turn|s)?)$/)
            && !Object.keys(css.config.semantics ?? semantics).includes(content)
            && !Object.keys(css.classes).includes(content)
        )
        || content.match(/\*\*/)
        || content.match(/:\[/)
        || content.match(/\$\{/)
        || content.match(/\{\{/)
        || content.match(/\(\{[^}]*\}/)
        || content.match(/<\w+>|<\/\w+>/)
        || content.match(/;$/)
        || content.match(/^\w+:\/\//)
        || content.match(/^@(?:ts-[^\s]+|charset|import|namespace|media|supports|document|page|font-face|keyframes|counter-style|font-feature-values|property|layer)$/)
}