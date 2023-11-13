const separatorRegEx = /([\t\n\f\r ]+)/

export default function extractClassnamesFromValue(classStr) {
    if (typeof classStr !== 'string') {
        return { classNames: [], whitespaces: [], headSpace: false, tailSpace: false }
    }
    const parts = classStr.split(separatorRegEx)
    if (parts[0] === '') {
        parts.shift()
    }
    if (parts[parts.length - 1] === '') {
        parts.pop()
    }
    const headSpace = separatorRegEx.test(parts[0])
    const tailSpace = separatorRegEx.test(parts[parts.length - 1])
    const isClass = (_, i) => (headSpace ? i % 2 !== 0 : i % 2 === 0)
    const isNotClass = (_, i) => (headSpace ? i % 2 === 0 : i % 2 !== 0)
    const classNames = parts.filter(isClass)
    const whitespaces = parts.filter(isNotClass)
    return { classNames: classNames, whitespaces: whitespaces, headSpace: headSpace, tailSpace: tailSpace }
}