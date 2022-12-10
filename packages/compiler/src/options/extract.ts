import MasterCSS, { semantics } from '@master/css'
import type { CompilerSource } from './index'

export default function extract({ content }: CompilerSource, masterCss: MasterCSS) {
    content = preExclude(content)
    const blocks = content.match(/[^\s]+/g) ?? []
    const strings = new Set<string>()
    for (const block of blocks) {
        const result = peelString(block)
        if (result.size) {
            for (const string of result) {
                strings.add(string)
            }
        } else {
            strings.add(trimString(block))
        }
    }
    return [...strings].filter(x => x && !checkToExclude(x, masterCss))
}

const trimString = (content: string) => {
    const originContent = content

    content = keepCompleteStringAndProcessContent(
        content,
        c => c
            .replace(/^.*(?:["'`]|(?<!@>?)=)/, '')
            .replace(/(?:[([{\\:#=.]+|["'`].*)$/, '')
    )

    if (originContent === content) {
        return content
    } else {
        return trimString(content)
    }
}


const findCompleteString = (content) => {
    const completeStrings = content.match(/((?<!\\)["'`])(?:\\\1|(?:(?!\1))[\S\s])*(?<!\\)\1/)
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
        const result = peelString(m[2])
        if (result.size) {
            for (const string of result) {
                strings.add(string)
            }
        } else {
            strings.add(trimString(m[2]))
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
            .replace(/(<[\w-]+\s(?:(?:(["'])(?:\\\2|[\s\S])*\2)|[^>])*\s*)style=(?:(?:(["'])(?:\\\3|[\s\S])*\3)|[^\s]+)/g, '$1')
    )
}

const checkToExclude = (content, css: MasterCSS) => {
    const completeStrings = findCompleteString(content)
    const checkContent = replaceCompleteString(content, completeStrings)

    return !checkContent
        || (
            !checkContent.match(/(?:\S*\{\S*\})|(?:^[\w-]+:[\w$#]+)|(?:^[@~][\w-]+$)/)
            && !Object.keys(css.config.semantics ?? semantics).includes(checkContent)
            && !Object.keys(css.classes).includes(checkContent)
        )
        || checkContent.match(/\*\*/)
        || checkContent.match(/:\[/)
        || checkContent.match(/\$\{/)
        || checkContent.match(/\{\{/)
        || checkContent.match(/\(\{[^}]*\}/)
        || checkContent.match(/<\w+>|<\/\w+>/)
        || checkContent.match(/;$/)
        || checkContent.match(/@(?:ts-[^\s]+|charset|import|namespace|media|supports|document|page|font-face|keyframes|counter-style|font-feature-values|property|layer)\b[^-]/)
}