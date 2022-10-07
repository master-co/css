module.exports = function hexToRgb(hex) {
    if (hex.startsWith('#')) {
        hex = hex.slice(1);
    }

    const aRgbHex = hex.match(/.{1,2}/g);
    return [parseInt(aRgbHex[0], 16), parseInt(aRgbHex[1], 16), parseInt(aRgbHex[2], 16)];
}