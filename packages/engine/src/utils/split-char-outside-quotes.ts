export default function splitCharOutsideQuotes(str: string, char: string) {
    const result = []
    let current = ''
    let inSingle = false
    let inDouble = false

    for (let i = 0; i < str.length; i++) {
        const c = str[i]
        const prev = str[i - 1]

        // 處理 quote 開關
        if (c === '\'' && !inDouble && prev !== '\\') {
            inSingle = !inSingle
        } else if (c === '"' && !inSingle && prev !== '\\') {
            inDouble = !inDouble
        }

        // 在引號之外遇到目標字元就切分
        if (c === char && !inSingle && !inDouble) {
            result.push(current.trim())
            current = ''
        } else {
            current += c
        }
    }

    if (current) result.push(current.trim())
    return result
}
