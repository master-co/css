export default function findMatchingPairs(input: string, startIndex: number, start: string, end: string) {
    let endIndex

    // {} [] ()
    if (start !== end) {
        let count = 1
        for (let i = startIndex; i < input.length; i++) {
            if (input[i] === start) {
                count++
            } else if (input[i] === end) {
                count--
                if (count === 0) {
                    endIndex = i
                    break
                }
            }
        }
    }
    // "" ''
    else {
        for (let i = startIndex; i < input.length; i++) {
            if (input[i] === start && input[i - 1] !== '\\') {
                return i
            }
        }
    }
    return endIndex
}