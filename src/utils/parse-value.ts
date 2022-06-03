import { normalizeCssCalcText } from './normalize-css-calc-text';

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
            const [levelColor, opacity] = token.split('/');
            for (const colorName in colors) {
                if (levelColor.startsWith(colorName)) {
                    const nextChar = levelColor[colorName.length];
                    if (!nextChar || nextChar === '-') {
                        value = 'rgb(' + VAR_START + levelColor + ')' + (opacity ? '/' + opacity : '') + ')';

                        return { value, unit, unitToken };
                    }
                }
            }
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