import { MasterCSSMediaFeatureRule } from './interfaces/media-feature-rule';
import { MasterCSSMedia } from './interfaces/media';
import { getCssPropertyText } from './utils/get-css-property-text';
import { parseValue } from './utils/parse-value';
import { PRIORITY_SELECTORS } from './constants/priority-selectors';
import { START_SYMBOL } from './constants/start-symbol';
import MasterCSS from './core';
import { MasterCSSDeclaration } from './interfaces/declaration';

const MATCHES = 'matches';
const SEMANTICS = 'semantics';
const SYMBOL = 'symbol';
const WIDTH = 'width';
const MAX_WIDTH = 'max-' + WIDTH;
const MIN_WIDTH = 'min-' + WIDTH;
const MOTION = 'motion';
const REDUCE = 'reduce';
const REDUCED_MOTION = REDUCE + 'd-' + MOTION;

const PX = 'px';
const REM = 'rem';

const selectorSymbols = ['!', '*', '>', '+', '~', ':', '[', '@', '_'];
const selectorSplitRegexp = /(\\'(?:.*?)[^\\]\\')(?=[*_>~+,)])|(\[[^=]+='(?:.*?)[^\\]'\])/;
const transformSelectorUnderline = (selector: string) => selector.split(selectorSplitRegexp)
    .map((eachToken, i) => i % 3 ? eachToken : eachToken.replace(/\_/g, ' '))
    .join('');

export interface RuleMatching {
    origin: 'matches' | 'semantics' | 'symbol';
    value?: string;
}

export class MasterCSSRule {

    readonly prefix: string;
    readonly symbol: string;
    readonly token: string;
    readonly prefixSelectors: string[];
    readonly suffixSelectors: string[];
    readonly important: boolean;
    readonly media: MasterCSSMedia;
    readonly at: Record<string, string> = {};
    readonly direction: string;
    readonly themeName: string;
    readonly unitToken: string;
    readonly hasWhere: boolean;
    readonly prioritySelectorIndex: number = -1;
    readonly natives: { unit: string, value: string | Record<string, string | number>, text: string, themeName: string, cssRule?: CSSRule }[] = [];

    static id: string;
    static propName: string;
    static matches: RegExp;
    static colorStarts: string;
    static symbol: string;
    static unit = REM;
    static colorful: boolean;

    static match(
        name: string,
        colorNames: string[]
    ): RuleMatching {
        /** 
         * STEP 1. matches
         */
        if (this.matches && this.matches.test(name)) {
            return { origin: MATCHES };
        }
        /** 
         * STEP 2. color starts
         */
        // TODO: 動態 new Regex 效能問題待優化
        if (this.colorStarts
            && (
                name.match('^' + this.colorStarts + '(?:(?:#|(rgb|hsl)\\(.*\\))((?!\\|).)*$|(?:transparent|current))')
                || colorNames.length
                && name.match('^' + this.colorStarts + '(' + colorNames.join('|') + ')')
                && name.indexOf('|') === -1
            )
        ) {
            return { origin: MATCHES };
        }
        /** 
         * STEP 3. symbol
         */
        if (this.symbol && name.startsWith(this.symbol)) {
            return { origin: SYMBOL };
        }
        /**
         * STEP 4. key full name
         */
        if (this.propName && name.startsWith(this.propName + ':')) {
            return { origin: MATCHES };
        }
    };

    constructor(
        public readonly className: string,
        public readonly matching: RuleMatching,
        public css: MasterCSS
    ) {
        const TargetRule = this.constructor as typeof MasterCSSRule;
        let { id, unit, propName, colorful } = TargetRule;
        const { breakpoints, mediaQueries, semantics, rootSize } = css.config;
        const values = css.config.values[id];
        const relationThemesMap = css.relationThemesMap[className];
        const { themeNames, colorsThemesMap, selectors } = css;

        let token = className;

        // 1. value / selectorToken
        let value: string | Record<string, string | number>, prefixToken: string, suffixToken: string, valueTokens: (string | { value: string })[];
        if (matching.origin === SEMANTICS) {
            suffixToken = token.slice(matching.value.length);
            value = semantics[matching.value];
        } else {
            let valueToken: string;
            if (matching.origin === MATCHES) {
                if (id === 'Group') {
                    let i = 0;
                    for (; i < token.length; i++) {
                        if (token[i] === '{' && token[i - 1] !== '\\') {
                            break;
                        }
                    }

                    prefixToken = token.slice(0, i);
                    valueToken = token.slice(i);
                } else {
                    const indexOfColon = token.indexOf(':');
                    this.prefix = token.slice(0, indexOfColon + 1);
                    if (this.prefix.includes('(')) {
                        this.prefix = undefined;
                        valueToken = token;
                    } else {
                        valueToken = token.slice(indexOfColon + 1);
                    }
                }
            } else if (matching.origin === SYMBOL) {
                this.symbol = token[0];
                valueToken = token.slice(1);
            }

            valueTokens = [];
            let currentValueToken = '';
            let i = 0;
            (function analyze(end?, depth?, func: string = '') {
                let varIndex: number;
                let isString = false;
                if (end) {
                    if (end === ')' && currentValueToken.slice(-1) === '$') {
                        varIndex = currentValueToken.length - 1;
                    } else if (end === '\'') {
                        isString = true;
                    }

                    currentValueToken += valueToken[i++];
                }

                for (; i < valueToken.length; i++) {
                    const val = valueToken[i];
                    if (val === end) {
                        currentValueToken += val;
                        if (isString) {
                            let count = 0;
                            for (let j = currentValueToken.length - 2; ; j--) {
                                if (currentValueToken[j] !== '\\') {
                                    break;
                                }
                                count++;
                            }
                            if (count % 2) {
                                continue;
                            }
                        }

                        if (varIndex !== undefined) {
                            currentValueToken = currentValueToken.slice(0, varIndex) + currentValueToken.slice(varIndex).replace(/\$\((.*)\)/, 'var(--$1)');
                        }

                        if (!depth) {
                            if (isString) {
                                valueTokens.push(currentValueToken);
                            } else {
                                valueTokens.push({ value: currentValueToken });
                            }

                            func = '';
                            currentValueToken = '';
                        }

                        break;
                    } else if (!isString && val in START_SYMBOL) {
                        analyze(START_SYMBOL[val], depth === undefined ? 0 : depth + 1, func);
                    } else if (val === '|' && end !== '}' && (!isString || func === 'path')) {
                        if (!end) {
                            valueTokens.push({ value: currentValueToken });
                            currentValueToken = '';
                        } else {
                            currentValueToken += ' ';
                        }
                    } else {
                        if (!end) {
                            if (val === '.') {
                                if (isNaN(+valueToken[i + 1])) {
                                    break;
                                } else if (valueToken[i - 1] === '-') {
                                    currentValueToken += '0';
                                }
                            } else if (val === ',') {
                                valueTokens.push({ value: currentValueToken }, ',');
                                currentValueToken = '';
                                continue;
                            } else if (
                                val === '#'
                                && (currentValueToken || valueTokens.length && valueToken[i - 1] !== '|')
                                || selectorSymbols.includes(val)
                            ) {
                                break;
                            }

                            func += val;
                        }

                        currentValueToken += val;
                    }
                }
            })();

            if (currentValueToken) {
                valueTokens.push({ value: currentValueToken });
            }

            suffixToken = valueToken.slice(i);
        }

        // 2. !important
        if (suffixToken[0] === '!') {
            this.important = true;
            suffixToken = suffixToken.slice(1);
        }

        // 3. prefix selector
        const analyzeSelectorToken = (selectorText: string) => {
            const transformedSelectorText = transformSelectorUnderline(selectorText);
            const selectors = [];

            let currentSelector: string = '';
            let symbolCount = 0;
            for (let i = 0; i < transformedSelectorText.length; i++) {
                const char = transformedSelectorText[i];
                if (char === '\\') {
                    currentSelector += char + transformedSelectorText[++i];
                    continue;
                }

                if (!symbolCount && char === ',') {
                    selectors.push(currentSelector);
                    currentSelector = '';
                } else {
                    currentSelector += char;

                    if (symbolCount && char === ')') {
                        symbolCount--;
                    } else if (char === '(') {
                        symbolCount++;
                    }
                }
            }
            if (currentSelector) {
                selectors.push(currentSelector);
            }

            return selectors;
        };

        this.prefixSelectors = prefixToken
            ? analyzeSelectorToken(prefixToken)
            : [''];

        // 4. suffix selector
        const suffixTokens = suffixToken.split('@');
        let suffixSelector = suffixTokens[0];
        if (suffixSelector) {
            this.suffixSelectors = [];

            const originalSuffixTokens = analyzeSelectorToken(suffixSelector);
            for (let eachOriginalSuffixToken of originalSuffixTokens) {
                for (const eachSingleSelectorEntry of selectors.single) {
                    eachOriginalSuffixToken = eachOriginalSuffixToken.replace(eachSingleSelectorEntry[0], eachSingleSelectorEntry[1]);
                }

                const transform = (selectorText: string) => {
                    for (const eachMultipleSelectorEntry of selectors.multiple) {
                        if (eachMultipleSelectorEntry[0].test(selectorText)) {
                            for (const eachSelectorText of eachMultipleSelectorEntry[1]) {
                                transform(selectorText.replace(eachMultipleSelectorEntry[0], eachSelectorText));
                            }
                            return;
                        }
                    }

                    this.suffixSelectors.push(selectorText);
                };
                transform(eachOriginalSuffixToken);
            }

            for (const eachSuffixSelector of this.suffixSelectors) {
                if (this.hasWhere !== false) {
                    this.hasWhere = eachSuffixSelector.includes(':where(');
                }

                for (let i = 0; i < PRIORITY_SELECTORS.length; i++) {
                    if (eachSuffixSelector.includes(PRIORITY_SELECTORS[i])) {
                        if (this.prioritySelectorIndex === -1 || this.prioritySelectorIndex > i) {
                            this.prioritySelectorIndex = i;
                        }
                        break;
                    }
                }
            }
        } else {
            this.suffixSelectors = [''];
        }

        // 5. atTokens
        for (let i = 1; i < suffixTokens.length; i++) {
            const atToken = suffixTokens[i];
            if (atToken) {
                if (themeNames.includes(atToken)) {
                    this.themeName = atToken;
                } else if (
                    atToken === 'rtl'
                    || atToken === 'ltr'
                ) {
                    this.direction = atToken;
                } else {
                    let type: string;
                    let queryText;

                    const underscoreIndex = atToken.indexOf('_');
                    if (underscoreIndex !== -1) {
                        type = atToken.slice(0, underscoreIndex);
                        queryText = atToken.slice(underscoreIndex);
                    } else {
                        const leftBracketIndex = atToken.indexOf('(');
                        if (leftBracketIndex !== -1) {
                            type = atToken.slice(0, leftBracketIndex);
                            queryText = atToken.slice(leftBracketIndex);
                        }
                    }

                    if (!type) {
                        type = 'media';
                        const queryTexts = [];

                        this.media = {
                            token: atToken,
                            features: {}
                        };
                        const typeOrFeatureTokens = atToken.split('&');
                        for (const typeOrFeatureToken of typeOrFeatureTokens) {
                            if (
                                typeOrFeatureToken === 'all'
                                || typeOrFeatureToken === 'print'
                                || typeOrFeatureToken === 'screen'
                                || typeOrFeatureToken === 'speech'
                            ) {
                                this.media.type = typeOrFeatureToken;
                            } else if (typeOrFeatureToken === '🖨') {
                                this.media.type = 'print';
                            } else {
                                if (typeOrFeatureToken === 'landscape' || typeOrFeatureToken === 'portrait') {
                                    queryTexts.push('(orientation:' + typeOrFeatureToken + ')');
                                } else if (typeOrFeatureToken === MOTION || typeOrFeatureToken === REDUCED_MOTION) {
                                    queryTexts.push('(prefers-' + REDUCED_MOTION + ':'
                                        + (typeOrFeatureToken === MOTION ? 'no-preference' : REDUCE)
                                        + ')');
                                } else if (mediaQueries && typeOrFeatureToken in mediaQueries) {
                                    queryTexts.push(mediaQueries[typeOrFeatureToken]);
                                } else {
                                    const feature: MasterCSSMediaFeatureRule = {
                                        token: typeOrFeatureToken
                                    }
                                    let featureName = '';
                                    let extremumOperator = '';
                                    let correction = 0;
                                    if (typeOrFeatureToken.startsWith('<=')) {
                                        extremumOperator = '<=';
                                        featureName = MAX_WIDTH;
                                    } else if (typeOrFeatureToken.startsWith('>=') || breakpoints[typeOrFeatureToken]) {
                                        extremumOperator = '>=';
                                        featureName = MIN_WIDTH;
                                    } else if (typeOrFeatureToken.startsWith('>')) {
                                        extremumOperator = '>';
                                        featureName = MIN_WIDTH;
                                        correction = .02;
                                    } else if (typeOrFeatureToken.startsWith('<')) {
                                        extremumOperator = '<';
                                        featureName = MAX_WIDTH;
                                        correction = -.02;
                                    }
                                    switch (featureName) {
                                        case MAX_WIDTH:
                                        case MIN_WIDTH:
                                            const conditionUnitValueToken
                                                = extremumOperator
                                                    ? typeOrFeatureToken.replace(extremumOperator, '')
                                                    : typeOrFeatureToken;
                                            const breakpoint = breakpoints[conditionUnitValueToken];
                                            if (breakpoint) {
                                                Object.assign(feature, parseValue(breakpoint, PX));
                                            } else {
                                                Object.assign(feature, parseValue(conditionUnitValueToken, PX));
                                            }
                                            if (feature.unit === PX) {
                                                feature.value += correction;
                                            }
                                            this.media.features[featureName] = feature;
                                            queryTexts.push('(' + featureName + ':' + (feature.value + feature.unit) + ')');
                                            break;
                                    }
                                }
                            }
                        }

                        queryText = '';
                        if (this.media.type) {
                            queryText = this.media.type;
                        }
                        if (queryTexts.length) {
                            queryText += (queryText ? ' and ' : '') + queryTexts.join(' and ');
                        }
                    }

                    if (queryText) {
                        this.at[type] = (type in this.at
                            ? this.at[type] + ' and '
                            : '')
                            + queryText.replace(/\_/g, ' ');
                    }
                }
            }
        }

        // 6. order
        if (this.order === undefined) {
            // @ts-ignore
            this.order = 0;
        }

        // 7. value
        const insertNewNative = (themeName: string, bypassWhenUnmatchColor: boolean) => {
            let newValue: string | Record<string, string | number>, newUnit: string;

            const generateCssText = (
                propertiesText: string,
                themeName: string
            ) => {
                let prefixText = '';
                if (this.direction) {
                    prefixText += '[dir=' + this.direction + '] ';
                }

                const prefixTexts = this.prefixSelectors.map(eachPrefixSelector => eachPrefixSelector + prefixText);
                const getCssText = (themeName: string, name: string) => {
                    const prefixThemeText = (themeName ? '.' + themeName + ' ' : '');
                    const esacpedName = '.' + CSS.escape(name);
                    return prefixTexts
                        .map(eachPrefixText => prefixThemeText + eachPrefixText)
                        .reduce((arr, eachPrefixText) => {
                            arr.push(
                                this.suffixSelectors
                                    .reduce((_arr, eachSuffixSelector) => {
                                        _arr.push(eachPrefixText + esacpedName + eachSuffixSelector);
                                        return _arr;
                                    }, [])
                                    .join(',')
                            );
                            return arr;
                        }, [])
                        .join(',');
                };

                let cssText = getCssText(themeName, className)
                    + (relationThemesMap
                        ? Object
                            .entries(relationThemesMap)
                            .filter(([relationTheme]) => this.themeName || !colorful || !themeName || !relationTheme || relationTheme === themeName)
                            .map(([relationTheme, classNames]) =>
                                classNames.reduce((str, className) => str + ',' + getCssText(this.themeName ?? (colorful ? themeName || relationTheme : relationTheme), className), '')
                            )
                            .join('')
                        : '')
                    + '{'
                    + propertiesText
                    + '}';
                for (const key of Object.keys(this.at).sort((a, b) => b === 'supports' ? -1 : 1)) {
                    cssText = '@' + key + ' ' + this.at[key] + '{' + cssText + '}';
                }

                return cssText;
            };

            const newValueTokens: string[] = [];
            if (valueTokens) {
                let uv, anyColorMatched: boolean = undefined;
                for (const eachValueToken of valueTokens) {
                    if (typeof eachValueToken === 'string') {
                        newValueTokens.push(eachValueToken);
                    } else {
                        uv = parseValue(
                            eachValueToken.value,
                            unit,
                            colorful && colorsThemesMap,
                            values,
                            rootSize,
                            this.themeName ? [this.themeName, ''] : [themeName]
                        );
                        if (uv.colorMatched !== undefined && anyColorMatched !== true) {
                            anyColorMatched = uv.colorMatched;
                        }

                        newValueTokens.push(uv.value + uv.unit);
                    }
                }

                if (bypassWhenUnmatchColor && (anyColorMatched === undefined ? themeName : !anyColorMatched))
                    return;

                if (newValueTokens.length === 1) {
                    if (uv) {
                        newValue = uv.value;
                        newUnit = uv.unit;
                    } else {
                        newValue = newValueTokens[0];
                    }
                } else {
                    newValue = newValueTokens.reduce((previousVal, currentVal, i) => previousVal + currentVal + ((currentVal === ',' || valueTokens[i + 1] === ',' || i === valueTokens.length - 1) ? '' : ' '), '');
                }

                if (typeof newValue !== 'object') {
                    // 8. parseValue
                    if (this.parseValue) {
                        newValue = this.parseValue(newValue);
                    }

                    // 9. transform value
                    if (colorful && newValue === 'current') {
                        newValue = 'currentColor';
                    } else if (values && newValue in values) {
                        newValue = values[newValue].toString();
                    }

                    const declaration = { unit: newUnit, value: newValue, important: this.important };
                    if (this.getThemeProps) {
                        const themeProps = this.getThemeProps(declaration, css);
                        for (const themeName in themeProps) {
                            this.natives.push({
                                unit: newUnit,
                                value: newValue,
                                text: generateCssText(
                                    Object
                                        .entries(themeProps[themeName])
                                        .map(([propertyName, propertyValue]) => getCssPropertyText(propertyName, {
                                            important: this.important,
                                            unit: '',
                                            value: propertyValue
                                        }))
                                        .join(';'),
                                    themeName
                                ),
                                themeName
                            });
                        }
                        return;
                    } else if (this.get) {
                        newValue = this.get(declaration);
                    }
                }
            } else {
                newValue = value;
            }

            this.natives.push({
                unit: newUnit,
                value: newValue,
                text: generateCssText(
                    typeof newValue === 'object'
                        ? Object
                            .entries(newValue)
                            .map(([propertyName, propertyValue]) => getCssPropertyText(propertyName, {
                                ...(typeof propertyValue === 'object'
                                    ? propertyValue
                                    : { unit: '', value: propertyValue }),
                                important: this.important
                            }))
                            .join(';')
                        : getCssPropertyText(propName, { unit: newUnit, value: newValue, important: this.important }),
                    themeName
                ),
                themeName
            });
        };

        if (this.getThemeProps) {
            insertNewNative(undefined, false);
        } else if (this.themeName) {
            insertNewNative(this.themeName, false);
        } else if (colorful) {
            for (const eachThemeName of themeNames) {
                insertNewNative(eachThemeName, true);
            }
        } else {
            insertNewNative('', false);
        }
    }
}

export interface MasterCSSRule {
    readonly order?: number;

    parseValue(value: string): string;
    get(declaration: MasterCSSDeclaration): Record<string, any>;
    getThemeProps(declaration: MasterCSSDeclaration, css: MasterCSS): Record<string, Record<string, string>>;
}

if (typeof window !== 'undefined') {
    window.MasterCSSRule = MasterCSSRule;
}

declare global {
    interface Window {
        MasterCSSRule: typeof MasterCSSRule;
    }
}