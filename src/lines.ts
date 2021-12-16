import { BOX, BREAK, CLAMP, DASH, DISPLAY, ELLIPSIS, HIDDEN, LINE, ORIENT, OVERFLOW, TEXT, VERTICAL, WORD, WRAP } from './constants/css-property-keyword';
import { WEBKIT_PREFIX } from './constants/css-browser-prefix';
import { Style } from '@master/style';

export class LinesStyle extends Style {
    static override prefixes = /^lines:/;
    static override defaultUnit = '';
    static override supportFullName = false;
    override get properties(): { [key: string]: any } {
        return {
            [OVERFLOW]: { ...this, value: HIDDEN },
            [DISPLAY]: { ...this, value: WEBKIT_PREFIX + BOX },
            [OVERFLOW + DASH + WRAP]: { ...this, value: BREAK + DASH + WORD },
            [TEXT + DASH + OVERFLOW]: { ...this, value: ELLIPSIS },
            [WEBKIT_PREFIX + BOX + DASH + ORIENT]: { ...this, value: VERTICAL },
            [WEBKIT_PREFIX + LINE + DASH + CLAMP]: this
        }
    }
}