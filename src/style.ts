import { StyleMediaFeature } from './interfaces/style-media-feature';
import { StyleMedia } from './interfaces/style-media';
import { getCssPropertyText } from './utils/get-css-property-text';
import { parseValue } from './utils/parse-value';
import { PRIORITY_SELECTORS } from './constants/priority-selectors';
import { StyleSheet } from './sheet';
import { START_SYMBOL } from './constants/start-symbol';
import { GROUP } from './constants/css-property-keyword';
const generateLevelColors = require('./utils/generate-level-colors');

const MATCHES = 'matches';
const SEMANTICS = 'semantics';
const SYMBOL = 'symbol';
const WIDTH = 'width';
const MAX_WIDTH = 'max-' + WIDTH;
const MIN_WIDTH = 'min-' + WIDTH;
const SCROLLBAR = 'scrollbar';
const SEARCH = 'search';
const METER = 'meter';
const PROGRESS = 'progress';
const RESIZER = 'resizer';
const SLIDER = 'slider';
const SLIDER_THUMB = SLIDER + '-thumb';
const SLIDER_RUNNABLE_TRACK = SLIDER + '-runnable-track';
const MOTION = 'motion';
const REDUCE = 'reduce';
const REDUCED_MOTION = REDUCE + 'd-' + MOTION;
const PSEUDO_PREFIX = '::';
const SCROLLBAR_PSEUDO = PSEUDO_PREFIX + SCROLLBAR;
const SLIDER_THUMB_PSEUDO = PSEUDO_PREFIX + SLIDER_THUMB;
const SLIDER_RUNNABLE_TRACK_PSEUDO = PSEUDO_PREFIX + SLIDER_RUNNABLE_TRACK;
const SEARCH_PSEUDO = PSEUDO_PREFIX + SEARCH;
const METER_PSEUDO = PSEUDO_PREFIX + METER;
const RESIZER_PSEUDO = PSEUDO_PREFIX + RESIZER;
const PROGRESS_PSEUDO = PSEUDO_PREFIX + PROGRESS;
const WEBKIT_PSEUDO_PREFIX = PSEUDO_PREFIX + '-webkit-';

const PX = 'px';
const REM = 'rem';

const selectorSymbols = ['!', '*', '>', '+', '~', ':', '[', '@', '_'];
const semanticSuffixes = [...selectorSymbols, undefined, '.'];
const scrollbarPseudoRegexp = new RegExp(SCROLLBAR_PSEUDO, 'g');
const searchPseudoRegexp = new RegExp(SEARCH_PSEUDO, 'g');
const meterPseudoRegexp = new RegExp(METER_PSEUDO, 'g');
const sliderRunnableTrackPseudoRegexp = new RegExp(SLIDER_RUNNABLE_TRACK_PSEUDO, 'g');
const sliderThumbPseudoRegexp = new RegExp(SLIDER_THUMB_PSEUDO, 'g');
const resizerPseudoRegexp = new RegExp(RESIZER_PSEUDO, 'g');
const progressPseudoRegexp = new RegExp(PROGRESS_PSEUDO, 'g');
const selectorSplitRegexp = /(\\'(?:.*?)[^\\]\\')(?=[*_>~+,)])|(\[[^=]+='(?:.*?)[^\\]'\])/;
const transformSelectorUnderline = (selector: string) => selector.split(selectorSplitRegexp)
    .map((eachToken, i) => i % 3 ? eachToken : eachToken.replace(/\_/g, ' '))
    .join('');

export interface StyleMatching {
    origin: 'matches' | 'semantics' | 'symbol';
    value?: string;
}

export const sheets: StyleSheet[] = [];

export class Style {

    readonly prefix: string;
    readonly symbol: string;
    readonly value: any | { [key: string]: string };
    readonly token: string;
    readonly prefixSelector: string;
    readonly suffixSelector: string;
    readonly important: boolean;
    readonly media: StyleMedia;
    readonly at: Record<string, string> = {};
    readonly direction: string;
    readonly colorScheme: string;
    readonly unit: string;
    readonly unitToken: string;
    readonly text: string
    readonly hasWhere: boolean;
    readonly prioritySelectorIndex: number = -1;

    cssRule: CSSRule;

    static id: string;
    static key: string;
    static matches: RegExp;
    static colorStarts: string;
    static symbol: string;
    static unit = REM;
    static colorful: boolean;
    static rootSize: number = 16;
    static readonly values: Record<string, any>;
    static readonly semantics: { [key: string]: any };
    static readonly breakpoints: { [key: string]: number };
    static readonly mediaQueries: { [key: string]: string } = {};
    static readonly sheets: StyleSheet[] = sheets;
    static readonly colors: Record<string, any> = {};
    static readonly classes: Record<string, string | string[]> = {};
    static readonly colorNames: string[] = [];
    static readonly relations: Record<string, string[]> = {};
    static readonly colorSchemes: string[] = ['dark', 'light'];

    static match(name: string): StyleMatching {
        /** 
         * STEP 1. matches
         */
        if (this.matches && this.matches.test(name)) {
            return { origin: MATCHES };
        }
        /**
         *  STEP 2. semantic
         */
        if (this.semantics) {
            for (const semanticName in this.semantics) {
                if (
                    /** f:bold center */
                    name === semanticName ||
                    /** f:bold@>sm center! center@<sm center:hover center.abs */
                    name.startsWith(semanticName) && semanticSuffixes.includes(name[semanticName.length])
                ) {
                    return { origin: SEMANTICS, value: semanticName };
                }
            }
        }
        /** 
         * STEP 3. color starts
         */
        // TODO: 動態 new Regex 效能問題待優化
        if (this.colorStarts
            && (
                name.match('^' + this.colorStarts + '(#|(rgb|hsl)\\(.*\\))((?!\\|).)*$')
                || this.colorNames.length
                && name.match('^' + this.colorStarts + '(' + this.colorNames.join('|') + ')')
                && name.indexOf('|') === -1
            )
        ) {
            return { origin: MATCHES };
        }
        /** 
         * STEP 4. symbol
         */
        if (this.symbol && name.startsWith(this.symbol)) {
            return { origin: SYMBOL };
        }
        /**
         * STEP 5. key full name
         */
        if (this.key && name.startsWith(this.key + ':')) {
            return { origin: MATCHES };
        }
    };

    constructor(
        public readonly name: string,
        public readonly matching?: StyleMatching
    ) {
        const TargetStyle = this.constructor as typeof Style;
        if (matching === undefined) {
            matching = TargetStyle.match(name);
            if (!matching) {
                console.warn(name + ' can\'t match any Style.');
                return;
            }
        }
        let { id, semantics, unit, colors, key, values, colorful, breakpoints, mediaQueries, colorSchemes, rootSize } = TargetStyle;
        let token = name;

        // 防止非色彩 style 的 token 被解析
        if (!colorful) {
            colors = null;
        }

        // 1. value / selectorToken
        let valueToken: string, prefixToken: string, suffixToken: string;
        if (matching.origin === SEMANTICS) {
            valueToken = matching.value;
            suffixToken = token.slice(matching.value.length);
            this.value = semantics[matching.value];
        } else {
            if (matching.origin === MATCHES) {
                if (id === GROUP) {
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

            let currentValueToken = '';
            let valueTokens = [];
            let i = 0;
            let uv;
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
                                uv = parseValue(currentValueToken, unit, colors, values, rootSize);
                                valueTokens.push(uv.value + uv.unit);
                            }

                            func = '';
                            currentValueToken = '';
                        }

                        break;
                    } else if (!isString && val in START_SYMBOL) {
                        analyze(START_SYMBOL[val], depth === undefined ? 0 : depth + 1, func);
                    } else if (val === '|' && end !== '}' && (!isString || func === 'path')) {
                        if (!end) {
                            uv = parseValue(currentValueToken, unit, colors, values, rootSize);
                            valueTokens.push(uv.value + uv.unit);
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
                                uv = parseValue(currentValueToken, unit, colors, values, rootSize);
                                valueTokens.push(uv.value + uv.unit, ',');
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
                uv = parseValue(currentValueToken, unit, colors, values, rootSize);
                valueTokens.push(uv.value + uv.unit);
            }

            suffixToken = valueToken.slice(i);

            if (valueTokens.length === 1) {
                if (uv) {
                    this.value = uv.value;
                    this.unit = uv.unit;
                } else {
                    this.value = valueTokens[0];
                    this.unit = '';
                }
            } else {
                this.value = valueTokens.reduce((previousVal, currentVal, i) => previousVal + currentVal + ((currentVal === ',' || valueTokens[i + 1] === ',' || i === valueTokens.length - 1) ? '' : ' '), '');
            }
        }

        // ::scrollbar -> ::-webkit-scrollbar
        if (suffixToken.includes(SCROLLBAR_PSEUDO)) {
            suffixToken = suffixToken.replace(scrollbarPseudoRegexp, WEBKIT_PSEUDO_PREFIX + SCROLLBAR);
        }
        // ::search -> ::-webkit-search
        if (suffixToken.includes(SEARCH_PSEUDO)) {
            suffixToken = suffixToken.replace(searchPseudoRegexp, WEBKIT_PSEUDO_PREFIX + SEARCH);
        }
        // ::slider-thumb -> ::-webkit-slider-thumb
        if (suffixToken.includes(SLIDER_THUMB_PSEUDO)) {
            suffixToken = suffixToken.replace(sliderThumbPseudoRegexp, WEBKIT_PSEUDO_PREFIX + SLIDER_THUMB);
        }
        // ::slider-runnable-track -> ::-webkit-slider-runnable-track
        if (suffixToken.includes(SLIDER_RUNNABLE_TRACK_PSEUDO)) {
            suffixToken = suffixToken.replace(sliderRunnableTrackPseudoRegexp, WEBKIT_PSEUDO_PREFIX + SLIDER_RUNNABLE_TRACK);
        }
        // ::meter -> ::-webkit-meter
        if (suffixToken.includes(METER_PSEUDO)) {
            suffixToken = suffixToken.replace(meterPseudoRegexp, WEBKIT_PSEUDO_PREFIX + METER);
        }
        // ::resizer -> ::-webkit-resizer
        if (suffixToken.includes(RESIZER_PSEUDO)) {
            suffixToken = suffixToken.replace(resizerPseudoRegexp, WEBKIT_PSEUDO_PREFIX + RESIZER);
        }
        // ::progress -> ::-webkit-progress
        if (suffixToken.includes(PROGRESS_PSEUDO)) {
            suffixToken = suffixToken.replace(progressPseudoRegexp, WEBKIT_PSEUDO_PREFIX + PROGRESS);
        }
        // :first -> :first-child
        if (suffixToken.includes(':first')) {
            suffixToken = suffixToken.replace(/:first(?![a-z-])/g, ':first-child');
        }
        // :last -> :last-child
        if (suffixToken.includes(':last')) {
            suffixToken = suffixToken.replace(/:last(?![a-z-])/g, ':last-child');
        }
        // :even -> :nth-child(2n)
        if (suffixToken.includes(':even')) {
            suffixToken = suffixToken.replace(/:even(?![a-z-])/g, ':nth-child(2n)');
        }
        // :odd -> :nth-child(odd)
        if (suffixToken.includes(':odd')) {
            suffixToken = suffixToken.replace(/:odd(?![a-z-])/g, ':nth-child(odd)');
        }
        // :nth( -> :nth-child(
        if (suffixToken.includes(':nth(')) {
            suffixToken = suffixToken.replace(/:nth\(/g, ':nth-child(');
        }

        // 2. parseValue
        if (this.parseValue) {
            this.value = this.parseValue;
        }

        // 3. transform value
        if (values && this.value in values) {
            this.value = values[this.value];
        }

        // 4. !important
        if (suffixToken[0] === '!') {
            this.important = true;
            suffixToken = suffixToken.slice(1);
        }

        // 5. prefix selector
        this.prefixSelector = prefixToken
            ? transformSelectorUnderline(prefixToken)
            : '';

        // 6. suffix selector
        const suffixTokens = suffixToken.split('@');
        let suffixSelector = suffixTokens[0];
        if (suffixSelector) {
            suffixSelector = transformSelectorUnderline(suffixSelector);
            this.hasWhere = suffixSelector.includes(':where(');
            for (let i = 0; i < PRIORITY_SELECTORS.length; i++) {
                if (suffixSelector.includes(PRIORITY_SELECTORS[i])) {
                    this.prioritySelectorIndex = i;
                    break;
                }
            }
        }
        this.suffixSelector = suffixSelector;

        // 7. atTokens
        for (let i = 1; i < suffixTokens.length; i++) {
            const atToken = suffixTokens[i];
            if (atToken) {
                if (colorSchemes.includes(atToken)) {
                    this.colorScheme = atToken;
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
                                } else if (typeOrFeatureToken in mediaQueries) {
                                    queryTexts.push(mediaQueries[typeOrFeatureToken]);
                                } else {
                                    const feature: StyleMediaFeature = {
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

        let prefixText = '';
        if (this.colorScheme) {
            prefixText += '.' + this.colorScheme + ' ';
        }
        if (this.prefixSelector) {
            prefixText += this.prefixSelector;
        }
        if (this.direction) {
            prefixText += '[dir=' + this.direction + '] ';
        }

        this.text = prefixText
            + '.'
            + CSS.escape(this.name)
            + this.suffixSelector
            + (this.name in Style.relations
                ? Style.relations[this.name].map(eachClassName => ', ' + prefixText + '.' + CSS.escape(eachClassName) + this.suffixSelector).join('')
                : '')
            + '{'
            + (typeof this.value === 'object'
                ? Object.keys(this.value)
                    .map((propertyName) => getCssPropertyText(propertyName, {
                        ...this,
                        unit: '',
                        value: this.value[propertyName]
                    }))
                    .join(';')
                : this.props
                    ? Object.keys(this.props)
                        .map((propertyName) => getCssPropertyText(propertyName, this.props[propertyName])).join(';')
                    : getCssPropertyText(key, this)
            )
            + '}';
        for (const key of Object.keys(this.at).sort((a, b) => b === 'supports' ? -1 : 1)) {
            this.text = '@' + key + ' ' + this.at[key] + '{' + this.text + '}';
        }

        if (this.order === undefined) {
            // @ts-ignore
            this.order = 0;
        }

        console.log(this);
    }

    static extend(
        property: 'classes' | 'breakpoints' | 'colors' | 'mediaQueries',
        ...settings: Record<string, any>[]
    ) {
        if (!settings.length)
            return this;

        const assignedSettings = Object.assign({}, ...settings);

        const handleSettings = (oldSettings: any, onAdd?: (key: string, value: any) => any, onDelete?: (key: string) => void) => {
            for (const key in assignedSettings) {
                const value = assignedSettings[key];
                if (value === null || value === undefined) {
                    if (key in oldSettings) {
                        onDelete?.(key);

                        delete oldSettings[key];
                    }
                } else {
                    oldSettings[key] = onAdd?.(key, value) ?? value;
                }
            }
        };

        switch (property) {
            case 'classes':
                handleSettings(
                    this.classes,
                    (semanticName, className: string | string[]) => {
                        // clear old value
                        if (semanticName in this.classes) {
                            for (const eachClassName in this.relations) {
                                const semanticNames = this.relations[eachClassName];
                                const index = semanticNames.indexOf(semanticName);
                                if (index !== -1) {
                                    if (semanticNames.length > 1) {
                                        semanticNames.splice(index, 1);
                                    } else {
                                        delete this.relations[eachClassName];
                                    }
                                }
                            }
                        }

                        const classNames = Array.isArray(className) ?
                            className :
                            className
                                .replace(/(?:\n(?:\s*))+/g, ' ')
                                .trim()
                                .split(' ')
                        for (const eachClassName of classNames) {
                            if (eachClassName in this.relations) {
                                this.relations[eachClassName].push(semanticName);
                            } else {
                                this.relations[eachClassName] = [semanticName];
                            }
                        }

                        return classNames;
                    },
                    (semanticName) => {
                        for (const eachClassName of this.classes[semanticName]) {
                            const relation = this.relations[eachClassName];
                            if (relation.length > 1) {
                                relation.splice(relation.indexOf(semanticName), 1);
                            } else {
                                delete this.relations[eachClassName];
                            }
                        }
                    });

                break;
            case 'colors':
                handleSettings(
                    this.colors,
                    (colorName, data) => {
                        const colorNameIndex = this.colorNames.indexOf(colorName);
                        if (colorNameIndex === -1) {
                            this.colorNames.push(colorName);
                        }
                        
                        return generateLevelColors(data);
                    },
                    (colorName) => {
                        /**
                         * 移除對應的 :root colors variable
                         */
                        const colorNameIndex = this.colorNames.indexOf(colorName);
                        if (colorNameIndex !== -1) {
                            this.colorNames.splice(colorNameIndex, 1);
                        }
                    });
                break;
            default:
                let oldSettings = this[property];
                if (!oldSettings) {
                    // @ts-ignore
                    oldSettings = this[property] = {};
                }
                handleSettings(oldSettings);
                break;
        }

        return this;
    };
}

export interface Style {
    readonly parseValue?: any;
    readonly props?: { [key: string]: any };
    readonly order?: number;
}

if (typeof window !== 'undefined') {
    window.MasterStyle = Style;
}

declare global {
    interface Window {
        MasterStyle: typeof Style;
    }
}