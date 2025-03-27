export default function replaceCharOutsideQuotes(str: string, target: string, replace: string) {
    let result = ''
    let inSingle = false
    let inDouble = false
    for (let i = 0; i < str.length; i++) {
        const char = str[i]
        const prev = str[i - 1]
        if (char === '\'' && prev !== '\\' && !inDouble) inSingle = !inSingle
        else if (char === '"' && prev !== '\\' && !inSingle) inDouble = !inDouble
        if (char === target && !inSingle && !inDouble) {
            result += replace
        } else {
            result += char
        }
    }
    return result
}