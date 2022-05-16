export function generateColorVariablesText(colorName: string, rgbColors: Record<string, string>) {
    let variablesText = ':root{';

    for (const level in rgbColors) {
        variablesText += '--' + colorName + (level ? '-' + level : '') + ':' + rgbColors[level] + ';';
    }

    variablesText += '}';

    return variablesText;
}