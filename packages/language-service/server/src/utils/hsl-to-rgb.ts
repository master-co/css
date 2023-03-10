import { Color } from 'vscode-languageserver'

export function hslToRgb(h: number, s: number, l: number, alpha?: number): Color {
    l /= 100
    const k = (n: number) => (n + h / 30) % 12
    const a = (s / 100) * Math.min(l, 1 - l)
    const f = (n: number) =>
        l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))

    return { red: 255 * f(0), green: 255 * f(8), blue: 255 * f(4), alpha: alpha ?? 1 }
}
