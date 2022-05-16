import { BOX, BREAK, dash, ELLIPSIS, HIDDEN, VERTICAL, WORD } from '../constants/css-property-keyword';
import { WEBKIT_PREFIX } from '../constants/css-browser-prefix';
import { Style } from '../style';

export class Lines extends Style {
    static id = 'lines';
    static override matches = /^lines:./;
    static override unit = '';
    override get props(): { [key: string]: any } {
        return {
            overflow: { ...this, value: HIDDEN },
            display: { ...this, value: WEBKIT_PREFIX + BOX },
            'overflow-wrap': { ...this, value: dash(BREAK, WORD) },
            'text-overflow': { ...this, value: ELLIPSIS },
            '-webkit-box-orient': { ...this, value: VERTICAL },
            '-webkit-line-clamp': this
        }
    }
}