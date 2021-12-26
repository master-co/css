import { BOX, BREAK, CLAMP, DASH, DISPLAY, ELLIPSIS, HIDDEN, LINE, ORIENT, OVERFLOW, TEXT, VERTICAL, WORD, WRAP } from './constants/css-property-keyword';
import { WEBKIT_PREFIX } from './constants/css-browser-prefix';
import { Style } from '@master/style';

export class LinesStyle extends Style {
    static override matches = /^lines:./;
    static override unit = '';
    override get props(): { [key: string]: any } {
        return {
            overflow: { ...this, value: HIDDEN },
            display: { ...this, value: WEBKIT_PREFIX + BOX },
            'overflow-wrap': { ...this, value: BREAK + DASH + WORD },
            'text-overflow': { ...this, value: ELLIPSIS },
            '-webkit-box-orient': { ...this, value: VERTICAL },
            '-webkit-line-clamp': this
        }
    }
}