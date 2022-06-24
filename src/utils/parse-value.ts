import { normalizeCssCalcText } from './normalize-css-calc-text';

const VAR_PATTERN = /var\(--(.*?)(?:,.+?)?\)/g;
const UNIT_VALUE_PATTERN = /^([+-.]?\d+(\.?\d+)?)(.*)?/;
const VAR_START = 'var(--';

export function parseValue(
    token: string | number,
    defaultUnit?: string,
    colors?: Record<string, Record<string, string>>,
    values?: Record<string, Record<string, string>>
) {
    let value: any = values ? values[token] : '';
    let unit: string = '';
    let unitToken: string = '';
    if (value) {
        return { value, unit, unitToken }
    } else if (typeof token === 'number') {
        value = token;
        unit = defaultUnit || '';
    } else {
        if (colors) {
            const colorValue = getColorValue(colors, token);
            if (colorValue) {
                return { value: colorValue, unit, unitToken };
            }

            token = token.replace(
                VAR_PATTERN,
                (origin, name) => getColorValue(colors, name) ?? origin);
        }
        if (defaultUnit) {
            const matches = token.match(UNIT_VALUE_PATTERN);
            // ['0.5deg', '0.5', 'deg', index: 0, input: '0.5deg', groups: undefined]
            if (matches) {
                if (token.includes('/')) {
                    // w:1/2 -> width: 50%
                    const splits = token.split('/');
                    return { value: (+splits[0] / +splits[1]) * 100 + '%', unit, unitToken }
                } else {
                    value = +matches[1];
                    unit = unitToken = matches[3] || '';
                    /**
                     * 當無單位值且 defaultUnit === 'rem'，
                     * 將 pxValue / 16 轉為 remValue
                     */
                    if (!unit) {
                        if (defaultUnit === 'rem' || defaultUnit === 'em') {
                            value = value / 16;
                        }
                        unit = defaultUnit || '';
                    }
                    return { value, unit, unitToken }
                }
            }
        }
        value = (token.indexOf('calc(') === -1
            ? token
            : normalizeCssCalcText(token))
            .replace(/\$\(((\w|-)+)\)/g, VAR_START + '$1)');;
    }
    return { value, unit, unitToken }
}

const getColorValue = (colors: Record<string, Record<string, string>>, token: string) => {
    let value: string;

    const [levelColor, opacityStr] = token.split('/');
    for (const colorName in colors) {
        if (levelColor.startsWith(colorName)) {
            const nextChar = levelColor[colorName.length];
            const level = !nextChar
                ? ''
                : nextChar === '-'
                    ? levelColor.slice(colorName.length + 1)
                    : undefined;
            if (level !== undefined) {
                const hexColor = colors[colorName][level];
                if (hexColor) {
                    value = '#' + hexColor;
                    if (opacityStr) {
                        let opacity = +opacityStr;
                        opacity = isNaN(opacity)
                            ? 1
                            : Math.min(Math.max(opacity, 0), 1);

                        value += Math.round(opacity * 255).toString(16).toUpperCase().padStart(2, '0');
                    }

                    break;
                }
            }
        }
    }

    return value;
};