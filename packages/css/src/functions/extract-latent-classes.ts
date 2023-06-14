import { MasterCSS } from '../core'
import type { Config } from '../config'

/**
 * @description Extract latent classes from content
 * @param content 
 * @param options 
 * @returns 
 */
export default function extractLatentClasses(content: string, options?: { css?: MasterCSS, config?: Config }) {
    let css: MasterCSS
    if (options?.css) {
        css = options?.css
    } else {
        css = new MasterCSS({ ...options?.config, observe: false })
    }
    content = preExclude(content)
    const reservedWord = [
        ...Object.keys(css.config.semantics),
        ...Object.keys(css.classes)
    ]
    const blocks = content.match(/\S+/g) ?? []
    const latentClasses = new Set<string>()
    for (const block of blocks) {
        latentClasses.add(trimString(block, reservedWord))
        const result = peelString(block)
        if (result.size) {
            for (const string of result) {
                latentClasses.add(trimString(string, reservedWord))
            }
        }
    }
    return Array.from(latentClasses)
        .filter(x => x && !checkToExclude(x, reservedWord))
}

const trimString = (content: string, reservedWord: string[]) => {
    const originContent = content

    const wxh = content.match(/(?:calc\(.*\)|\d+(?:%|ch|cm|em|ex|in|mm|pc|pt|px|rem|vh|vmax|vmin|vw|deg|grad|rad|turn|s)?)x(?:calc\(.*\)|\d+(?:%|ch|cm|em|ex|in|mm|pc|pt|px|rem|vh|vmax|vmin|vw|deg|grad|rad|turn|s)?)/g)

    if ((wxh?.length ? reservedWord.concat(wxh) : reservedWord).find(x => originContent.startsWith(x))) {
        content = keepCompleteStringAndProcessContent(
            content,
            c => c
                .replace(/^[^:@~(]*(?<!@>?)=/, '')
                .replace(/(?:[([{\\:#=.]+|["'`].*)$/, '')
        )
    } else {
        content = keepCompleteStringAndProcessContent(
            content,
            c => c
                .replace(/^[^:@~(]*(?:["'`]|(?<!@>?)=)/, '')
                .replace(/(?:[([{\\:#=.]+|["'`].*)$/, '')
        )
    }

    if (originContent === content || !content) {
        return content
    } else {
        return trimString(content, reservedWord)
    }
}


const findCompleteString = (content: string) => {
    const completeStrings = content.match(/((?<!\\)["'`])(?:\\\1|(?:(?!\1))[\S\s])*(?<!\\)\1/g)
    return completeStrings
}

const replaceCompleteString = (content: string, completeStrings: string[]) => {
    completeStrings?.forEach((completeString, index) => {
        content = content.replace(completeString, `COMPLETE-STRING--${index}--`)
    })
    return content
}

const keepCompleteStringAndProcessContent = (content: string, process: (content: string) => string) => {
    const completeStrings = findCompleteString(content)
    content = replaceCompleteString(content, completeStrings)
    content = process(content)
    completeStrings?.forEach((completeString, index) => {
        content = content.replace(`COMPLETE-STRING--${index}--`, completeString)
    })

    return content
}

const peelString = (content: string) => {
    const strings = new Set<string>()
    const stringRegx = /((?<!\\)["'`])((?:\\\1|(?:(?!\1))[\S\s])*)((?<!\\)\1)/g
    let m: RegExpExecArray
    while ((m = stringRegx.exec(content)) !== null) {
        if (m.index === stringRegx.lastIndex) {
            stringRegx.lastIndex++
        }
        strings.add(m[2])
        const result = peelString(m[2])
        if (result.size) {
            for (const string of result) {
                strings.add(string)
            }
        }
    }
    return strings
}

const preExclude = (content: string) => {
    return keepCompleteStringAndProcessContent(
        content,
        c => c
            .replace(/\/\*(?:(?!\*\/)[\S\s])*\*\//g, '')
            .replace(/<!--(?:(?!-->)[\S\s])*-->/g, '')
            .replace(/\/\/.*/g, '')
            .replace(/<style[^>]*>(?:(?!<\/style>)[\S\s])*<\/style>/g, '')
            .replace(/import.*from\s*COMPLETE-STRING--\d+--/g, '')
            .replace(/import\s*(?:COMPLETE-STRING--\d+--|\([^;\s]*\))/g, '')
            .replace(/(?:require|import)\([^;\s]*\)/g, '')
            .replace(/(?:@.*\n)+(?:export|function|class)/g, '')
    )
}

const checkToExclude = (content: string, reservedWord: string[]) => {
    const completeStrings = findCompleteString(content)
    const checkContent: string = replaceCompleteString(content, completeStrings)
    const groupRegx = /{(.*)}/
    let m: RegExpExecArray
    while ((m = groupRegx.exec(checkContent)) !== null) {
        const groupClasses = m[1].split(';')
        return groupClasses.find(x => needExclude(x, reservedWord)) !== undefined
    }
    return needExclude(checkContent, reservedWord) || hasUnclosedBrackets(content)
}

const needExclude = (content: string, reservedWord: string[]) => {
    return !content
        || (
            !content.match(/(?:\S*\{\S*\})|(?:^[\w\-()]+:\S+)|(?:^[\w-]+\(\S+\))|(?:^[@~]\S+$)/)
            && !content.match(/^(?:calc\(.*\)|\d+(?:%|ch|cm|em|ex|in|mm|pc|pt|px|rem|vh|vmax|vmin|vw|deg|grad|rad|turn|s)?)x(?:calc\(.*\)|\d+(?:%|ch|cm|em|ex|in|mm|pc|pt|px|rem|vh|vmax|vmin|vw|deg|grad|rad|turn|s)?)$/)
            && !reservedWord.find(x => content.startsWith(x))
        )
        || content.match(/\*\*/)
        || content.match(/:\[/)
        || content.match(/\$\{/)
        || content.match(/\{\{/)
        || content.match(/\(\{[^}]*\}/)
        || content.match(/<\w+>|<\/\w+>/)
        || content.match(/;$/)
        || content.match(/^\w+:\/\//)
        || content.match(/^@(?:ts-[^\s]+|charset|import|namespace|media|supports|document|page|font-face|keyframes|counter-style|font-feature-values|property|layer|[^/]+\/.*)$/)
        || content.match(/^~\/.+.\w+$/)
        || content.match(/function\(|\(.*\)=>/)
        || content.match(/^\$\(.*/)
}

const hasUnclosedBrackets = (content: string) => {
    const brackets = []
    let left = undefined
    for (let i = 0; i < content.length; i++) {
        switch (content[i]) {
            case '(':
            case '[':
            case '{':
                brackets.push(content[i])
                break
            case ')':
            case ']':
            case '}':
                left = brackets.pop()
                if (
                    content[i] === ')' && left !== '(' ||
                    content[i] === ']' && left !== '[' ||
                    content[i] === '}' && left !== '{'
                ) {
                    return true
                }
                break
        }
    }

    if (brackets.length > 0) {
        return true
    }
    return false
}