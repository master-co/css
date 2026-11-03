import { masterCssColors } from './constant'

import { Color, Position, TextEdit } from './masterCssinterface'

import { Style } from '@master/css';


export function GetDocumentColors(text: string, language: string) {
    let colors = []

    let classPattern = /class="([^"]*)"|class='([^']*)'|class=`([^`]*)`|class={([^]*)}|(?:((?:add)|(?:remove)|(?:replace)|(?:toggle)))\(([^\)]+)\)/g;
    if (!(language == 'tsx' || language == 'ts' || language == 'jsx' || language == 'js')) {
        classPattern = /class="([^"]*)"|class='([^']*)'|class=`([^`]*)`|class={([^]*)}/g;
    }
    let classMatch: RegExpExecArray | null;

    while ((classMatch = classPattern.exec(text)) !== null) {

        const colorPattern = /(?<=[:|])(?:#?\w+(?:-[\d]{1,2})?(?:\/.?[\d])?(?:\([^\s\)]+\))?)/g;
        const rgbaColorPattern = /rgba?\(([\d.]+),([\d.]+),([\d.]+)(?:,([\d.]+))?\)/g;
        const hslaColorPattern = /hsla?\(([\d.]+),([\d.]+)%,([\d.]+)%(?:,([\d.]+))?\)/g;
        const hexColorPattern = /#([abcdef\d]{6,8})?/g;
        let colorMatch: RegExpExecArray | null;
        let colorMatch2: RegExpExecArray | null;
        let colorName: string;
        let colorNumber: number;
        let colorAlpha: number;

        //check color

        while ((colorMatch = colorPattern.exec(classMatch[0])) !== null) {
            //#region  for rgb、hls
            if ((colorMatch2 = rgbaColorPattern.exec(colorMatch[0]))) {
                const colorInformation = {
                    index: {
                        start: classMatch.index + colorMatch.index,
                        end: classMatch.index + colorMatch.index + colorMatch[0].length
                    },
                    color: getColorValue({ red: Number(colorMatch2[1]), green: Number(colorMatch2[2]), blue: Number(colorMatch2[3]), alpha: colorMatch2[4] == undefined ? 1 : Number(colorMatch2[4]) })
                };
                colors.push(colorInformation);
            }
            else if ((colorMatch2 = hslaColorPattern.exec(colorMatch[0]))) {
                const colorInformation = {
                    index: {
                        start: classMatch.index + colorMatch.index,
                        end: classMatch.index + colorMatch.index + colorMatch[0].length
                    },
                    color: getColorValue(hslToRgb(Number(colorMatch2[1]), Number(colorMatch2[2]), Number(colorMatch2[3]), colorMatch2[4] == undefined ? 1 : Number(colorMatch2[4])))
                };
                colors.push(colorInformation);
            }
            else if ((colorMatch2 = hexColorPattern.exec(colorMatch[0]))) {
                const colorInformation = {
                    index: {
                        start: classMatch.index + colorMatch.index,
                        end: classMatch.index + colorMatch.index + colorMatch[0].length
                    },
                    color: getColorValue(hexToRgb(colorMatch2[1]))
                };
                colors.push(colorInformation);
            }
            //#endregion for rgb、hls

            //#region for mastercss color
            colorAlpha = 1;
            if (colorMatch[0].split('/').length == 2) {
                colorAlpha = Number('0' + colorMatch[0].split('/')[1]);
            }
            if (colorMatch[0].split('-').length == 1)//:black  black/.5
            {
                colorName = colorMatch[0].split('/')[0];
                colorName = colorName.endsWith('_') ? colorName.replace('_', '') : colorName;
                if (colorName == 'black') {
                    const colorInformation = {
                        index: {
                            start: classMatch.index + colorMatch.index,
                            end: classMatch.index + colorMatch.index + colorMatch[0].length
                        },
                        color: { red: 0, green: 0, blue: 0, alpha: colorAlpha }
                    };
                    colors.push(colorInformation);
                }
                else if (colorName == 'white') {
                    const colorInformation = {
                        index: {
                            start: classMatch.index + colorMatch.index,
                            end: classMatch.index + colorMatch.index + colorMatch[0].length
                        },
                        color: { red: 1, green: 1, blue: 1, alpha: colorAlpha }
                    };
                    colors.push(colorInformation);
                }
                else {
                    if (masterCssColors.findIndex(x => x.key == colorName) != -1) {
                        const colorInformation = {
                            index: {
                                start: classMatch.index + colorMatch.index,
                                end: classMatch.index + colorMatch.index + colorMatch[0].length
                            },
                            color: getColorsRGBA(colorName, 50, colorAlpha)
                        };
                        colors.push(colorInformation);
                    }
                }

            }
            else if (colorMatch[0].split('-').length == 2) { //:red-60 red-60/.5

                colorName = colorMatch[0].split('-')[0];
                colorNumber = Number(colorMatch[0].split('-')[1].split('/')[0]);


                if (masterCssColors.findIndex(x => x.key == colorName) != -1 && colorNumber > 0 && colorNumber < 100 && colorNumber % 2 == 0) {
                    const colorInformation = {
                        index: {
                            start: classMatch.index + colorMatch.index,
                            end: classMatch.index + colorMatch.index + colorMatch[0].length
                        },
                        color: getColorsRGBA(colorName, colorNumber, colorAlpha)
                    };
                    colors.push(colorInformation);
                }
            }

            else if (colorMatch[0].split('-').length != 2) {
                continue;
            }
            //#endregion  for mastercss color
        }
    }
    return colors;
}

function getColorsRGBA(colorName: string, colorNumber: number, colorAlpha: number = 1): Color {
    const rgbColors = Style.colors;

    const rgbColorValue = rgbColors[colorName];
    const levelRgb = rgbColorValue[colorNumber];

    let levelRgbitem = hexToRgb(levelRgb);

    return { red: +levelRgbitem.red / 255, green: +levelRgbitem.green / 255, blue: +levelRgbitem.blue / 255, alpha: colorAlpha };
}
export interface HWBA { h: number; w: number; b: number; a: number; }

export interface HSLA { h: number; s: number; l: number; a: number; }

function toTwoDigitHex(n: number): string {
    const r = n.toString(16);
    return r.length !== 2 ? '0' + r : r;
}
export function hslFromColor(rgba: Color): HSLA {
    const r = rgba.red;
    const g = rgba.green;
    const b = rgba.blue;
    const a = rgba.alpha;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (min + max) / 2;
    const chroma = max - min;

    if (chroma > 0) {
        s = Math.min((l <= 0.5 ? chroma / (2 * l) : chroma / (2 - (2 * l))), 1);

        switch (max) {
            case r: h = (g - b) / chroma + (g < b ? 6 : 0); break;
            case g: h = (b - r) / chroma + 2; break;
            case b: h = (r - g) / chroma + 4; break;
        }

        h *= 60;
        h = Math.round(h);
    }
    return { h, s, l, a };
}
export function hwbFromColor(rgba: Color): HWBA {
    const hsl = hslFromColor(rgba);
    const white = Math.min(rgba.red, rgba.green, rgba.blue);
    const black = 1 - Math.max(rgba.red, rgba.green, rgba.blue);

    return {
        h: hsl.h,
        w: white,
        b: black,
        a: hsl.a
    };
}


export function hslToRgb(h: number, s: number, l: number, alpha?: number): Color {
    l /= 100;
    const k = (n: number) => (n + h / 30) % 12;
    const a = (s / 100) * Math.min(l, 1 - l);
    const f = (n: number) =>
        l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));

    return { red: 255 * f(0), green: 255 * f(8), blue: 255 * f(4), alpha: alpha ?? 1 }
}


export function hexToRgb(hex: string): Color {
    const aRgbHex = hex.match(/.{1,2}/g);
    return { red: parseInt(aRgbHex?.[0] ?? '0', 16), green: parseInt(aRgbHex?.[1] ?? '0', 16), blue: parseInt(aRgbHex?.[2] ?? '0', 16), alpha: parseInt(aRgbHex?.[3] ?? 'FF', 16) }
}
export function getColorValue(color: Color): Color {
    return { red: color.red / 255.0, green: color.green / 255.0, blue: color.blue / 255.0, alpha: color.alpha }
}

export function GetColorPresentation(color: Color, range: { start: Position, end: Position }) {
    const result: {
        label: string;
        textEdit?: TextEdit;
        additionalTextEdits?: TextEdit[];
    }[] = [];

    const red256 = Math.round(color.red * 255), green256 = Math.round(color.green * 255), blue256 = Math.round(color.blue * 255);

    let label;
    if (color.alpha === 1) {
        label = `rgb(${red256},${green256},${blue256})`;
    } else {
        label = `rgba(${red256},${green256},${blue256},${color.alpha})`;
    }
    result.push({ label: label, textEdit: { range: range, newText: label } });

    if (color.alpha === 1) {
        label = `#${toTwoDigitHex(red256)}${toTwoDigitHex(green256)}${toTwoDigitHex(blue256)}`;
    } else {
        label = `#${toTwoDigitHex(red256)}${toTwoDigitHex(green256)}${toTwoDigitHex(blue256)}${toTwoDigitHex(Math.round(color.alpha * 255))}`;
    }
    result.push({ label: label, textEdit: { range: range, newText: label } });

    const hsl = hslFromColor(color);
    if (hsl.a === 1) {
        label = `hsl(${hsl.h},${Math.round(hsl.s * 100)}%,${Math.round(hsl.l * 100)}%)`;
    } else {
        label = `hsla(${hsl.h},${Math.round(hsl.s * 100)}%,${Math.round(hsl.l * 100)}%,${hsl.a})`;
    }
    result.push({ label: label, textEdit: { range: range, newText: label } });

    // const hwb = hwbFromColor(color);
    // if (hwb.a === 1) {
    //     label = `hwb(${hwb.h} ${Math.round(hwb.w * 100)}% ${Math.round(hwb.b * 100)}%)`;
    // } else {
    //     label = `hwb(${hwb.h} ${Math.round(hwb.w * 100)}% ${Math.round(hwb.b * 100)}% / ${hwb.a})`;
    // }
    // result.push({ label: label, textEdit: TextEdit.replace(range, label) });

    return result;
}