import { Color } from 'vscode-languageserver'

export interface HSLA { h: number; s: number; l: number; a: number; }

export function rgbToHsl(rgba: Color): HSLA {
    const r = rgba.red
    const g = rgba.green
    const b = rgba.blue
    const a = rgba.alpha

    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    let h = 0
    let s = 0
    const l = (min + max) / 2
    const chroma = max - min

    if (chroma > 0) {
        s = Math.min((l <= 0.5 ? chroma / (2 * l) : chroma / (2 - (2 * l))), 1)

        switch (max) {
            case r: h = (g - b) / chroma + (g < b ? 6 : 0); break
            case g: h = (b - r) / chroma + 2; break
            case b: h = (r - g) / chroma + 4; break
        }

        h *= 60
        h = Math.round(h)
    }
    return { h, s, l, a }
}