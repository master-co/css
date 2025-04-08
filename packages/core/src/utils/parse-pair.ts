export interface ParsedPair {
    start: number;
    end: number;
    pre: string;
    body: string;
    post: string;
}

export default function parsePair(
    str: string,
    a = '(',
    b = ')'
): ParsedPair | null {
    const stack: { start: number }[] = []
    let result: ParsedPair | null = null
    let inString: '"' | '\'' | null = null

    for (let i = 0; i < str.length; i++) {
        const char = str[i]
        const prevChar = str[i - 1]

        // 處理 escape 字元，例如 \"
        if (char === '\\') {
            i++ // skip next character
            continue
        }

        // 處理字串區段進入與離開
        if ((char === '"' || char === '\'') && prevChar !== '\\') {
            if (inString === char) {
                inString = null // 離開字串
            } else if (!inString) {
                inString = char // 進入字串
            }
            continue
        }

        if (inString) continue // 若在字串中就忽略括號處理

        // 開始符號
        if (str.startsWith(a, i)) {
            stack.push({ start: i })
            i += a.length - 1
        }
        // 結束符號
        else if (str.startsWith(b, i)) {
            const last = stack.pop()
            if (last) {
                result = {
                    start: last.start,
                    end: i,
                    pre: str.slice(
                        stack.length > 0
                            ? stack[stack.length - 1].start + a.length
                            : 0,
                        last.start
                    ),
                    body: str.slice(last.start + a.length, i),
                    post: str.slice(i + b.length),
                }
            }
            i += b.length - 1
        }
    }
    return result
}
