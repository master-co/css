import { BOX, BREAK, dash, ELLIPSIS, HIDDEN, VERTICAL, WORD } from '../constants/css-property-keyword';
import { WEBKIT_PREFIX } from '../constants/css-browser-prefix';
import { MasterCSSRule } from '../rule';

export class Lines extends MasterCSSRule {
    static id = 'lines';
    static override matches = /^lines:./;
    static override unit = '';
    override getProps(propertyInfo): { [key: string]: any } {
        return {
            overflow: { ...propertyInfo, value: HIDDEN },
            display: { ...propertyInfo, value: WEBKIT_PREFIX + BOX },
            'overflow-wrap': { ...propertyInfo, value: dash(BREAK, WORD) },
            'text-overflow': { ...propertyInfo, value: ELLIPSIS },
            '-webkit-box-orient': { ...propertyInfo, value: VERTICAL },
            '-webkit-line-clamp': propertyInfo
        }
    }
}