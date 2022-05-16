export function hexToRgb(hex: string) {
    const aRgbHex = hex.match(/.{1,2}/g);
    return [parseInt(aRgbHex[0], 16), parseInt(aRgbHex[1], 16), parseInt(aRgbHex[2], 16)];
}