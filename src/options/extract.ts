import defaultSemantics from '../config/semantics'

export default function extract({ source }) {
    const blocks = source.match(/[^\s]+/g) ?? []
    const strings = new Set()
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

    return [...strings].filter(x => x && !checkToExclude(x))
}

const trimString = (content) => {
    const originContent = content;
    content = content.replace(/^([\w={[(\\]*["'`])/, '')
    if (!content.match(/^content:((?<!\\)["'`])((?:\\\1|(?:(?!\1))[\S\s])*)((?<!\\)\1)$/)) {
        content = content.replace(/(\.*|[([{\\:]*|["'`].*)$/, '')
    }
    if (originContent === content) {
        return content
    } else {
        return trimString(content)
    }
}

const peelString = (content) => {
    const strings = new Set()
    const stringRegx = /((?<!\\)["'`])((?:\\\1|(?:(?!\1))[\S\s])*)((?<!\\)\1)/g
    let m;
    while ((m = stringRegx.exec(content)) !== null) {
        if (m.index === stringRegx.lastIndex) {
            stringRegx.lastIndex++;
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

const checkToExclude = (content) => {
    return !content
        || (!content.match(/(?:^[\w-]+:[\w$#]+)|(?:^[@~][\w-]+$)/) && !Object.keys(defaultSemantics).includes(content))
        || content.match(/\*\*/)
        || content.match(/:\[/)
        || content.match(/\$\{/)
        || content.match(/\{\{/)
        || content.match(/\(\{[^}]*\}/)
        || content.match(/<\w+>|<\/\w+>/)
}