
export function toTwoDigitHex(n: number): string {
    const r = n.toString(16)
    return r.length !== 2 ? '0' + r : r
}