import { BOX, BREAK, dash, ELLIPSIS, HIDDEN, VERTICAL, WORD } from '../constants/css-property-keyword';
import { WEBKIT_PREFIX } from '../constants/css-browser-prefix';
import { MasterCSSRule } from '../rule';

export class Lines extends MasterCSSRule {
    static override matches = /^lines:./;
    static override unit = '';
    override get(declaration): { [key: string]: any } {
        return {
            overflow: { ...declaration, value: HIDDEN },
            display: { ...declaration, value: WEBKIT_PREFIX + BOX },
            'overflow-wrap': { ...declaration, value: dash(BREAK, WORD) },
            'text-overflow': { ...declaration, value: ELLIPSIS },
            '-webkit-box-orient': { ...declaration, value: VERTICAL },
            '-webkit-line-clamp': declaration
        }
    }
}