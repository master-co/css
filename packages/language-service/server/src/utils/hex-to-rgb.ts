import {
    Color
} from 'vscode-languageserver/node'

export function hexToRgb(hex: string): Color {
    const aRgbHex = hex.replace('#', '').match(/.{1,2}/g)
    return { red: parseInt(aRgbHex?.[0] ?? '0', 16), green: parseInt(aRgbHex?.[1] ?? '0', 16), blue: parseInt(aRgbHex?.[2] ?? '0', 16), alpha: parseInt(aRgbHex?.[3] ?? 'FF', 16) }
}