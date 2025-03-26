interface Pair {
    start: number;
    end: number;
    pre: string;
    body: string;
    post: string;
}

export default function parsePairs(
    str: string,
    a = '(',
    b = ')'
): Pair | null {
    const stack: { start: number }[] = []
    let result: Pair | null = null
    for (let i = 0; i < str.length; i++) {
        // 如果是被 escape 的括號就跳過
        if (str[i] === '\\') {
            i++
            continue
        }
        // 遇到開始符號
        if (str.startsWith(a, i)) {
            stack.push({ start: i })
            i += a.length - 1
        }
        // 遇到結束符號
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
