import { Style } from '@master/style';
import { DASH, PADDING, SCROLL } from './constants/css-property-keyword';
import { B, BOTTOM, L, LEFT, R, RIGHT, T, TOP, X, Y } from './constants/direction';

export class ScrollPadding extends Style {
    static id = 'scrollPadding';
    static override matches = /^scroll-p([xytblr]|adding(-(top|bottom|left|right))?)?:./;
    override get props(): { [key: string]: any } {
        if (this.prefix.slice(-3, -2) === 'p') {
            const SCROLL_PADDING_PREFIX = SCROLL + DASH + PADDING + DASH,
                SCROLL_PADDING_LEFT = SCROLL_PADDING_PREFIX + LEFT,
                SCROLL_PADDING_RIGHT = SCROLL_PADDING_PREFIX + RIGHT,
                SCROLL_PADDING_TOP = SCROLL_PADDING_PREFIX + TOP,
                SCROLL_PADDING_BOTTOM = SCROLL_PADDING_PREFIX + BOTTOM;

            switch (this.prefix.slice(-2, -1)) {
                case X:
                    return {
                        [SCROLL_PADDING_LEFT]: this,
                        [SCROLL_PADDING_RIGHT]: this
                    }
                case Y:
                    return {
                        [SCROLL_PADDING_TOP]: this,
                        [SCROLL_PADDING_BOTTOM]: this
                    }
                case L:
                    return {
                        [SCROLL_PADDING_LEFT]: this
                    }
                case R:
                    return {
                        [SCROLL_PADDING_RIGHT]: this
                    }
                case T:
                    return {
                        [SCROLL_PADDING_TOP]: this
                    }
                case B:
                    return {
                        [SCROLL_PADDING_BOTTOM]: this
                    }
            }
        } else {
            return {
                [this.prefix.replace(/-p(?!adding)/, '-' + PADDING).slice(0, -1)]: this
            }
        }
    }
    override get order(): number {
        return (this.prefix === SCROLL + DASH + PADDING + ':' || this.prefix === SCROLL + DASH + 'p:') ? -1 : 0;
    }
}