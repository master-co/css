import { MasterCSSRule } from '../rule';
import { dash, PADDING, SCROLL } from '../constants/css-property-keyword';
import { B, BOTTOM, L, LEFT, R, RIGHT, T, TOP, X, Y } from '../constants/direction';

export class ScrollPadding extends MasterCSSRule {
    static id = 'scrollPadding';
    static override matches = /^scroll-p([xytblr]|adding(-(top|bottom|left|right))?)?:./;
    override get(declaration): { [key: string]: any } {
        if (this.prefix.slice(-3, -2) === 'p') {
            const SCROLL_PADDING_PREFIX = dash(SCROLL, PADDING) + '-',
                SCROLL_PADDING_LEFT = SCROLL_PADDING_PREFIX + LEFT,
                SCROLL_PADDING_RIGHT = SCROLL_PADDING_PREFIX + RIGHT,
                SCROLL_PADDING_TOP = SCROLL_PADDING_PREFIX + TOP,
                SCROLL_PADDING_BOTTOM = SCROLL_PADDING_PREFIX + BOTTOM;

            switch (this.prefix.slice(-2, -1)) {
                case X:
                    return {
                        [SCROLL_PADDING_LEFT]: declaration,
                        [SCROLL_PADDING_RIGHT]: declaration
                    }
                case Y:
                    return {
                        [SCROLL_PADDING_TOP]: declaration,
                        [SCROLL_PADDING_BOTTOM]: declaration
                    }
                case L:
                    return {
                        [SCROLL_PADDING_LEFT]: declaration
                    }
                case R:
                    return {
                        [SCROLL_PADDING_RIGHT]: declaration
                    }
                case T:
                    return {
                        [SCROLL_PADDING_TOP]: declaration
                    }
                case B:
                    return {
                        [SCROLL_PADDING_BOTTOM]: declaration
                    }
            }
        } else {
            return {
                [this.prefix.replace(/-p(?!adding)/, '-' + PADDING).slice(0, -1)]: declaration
            }
        }
    }
    override get order(): number {
        return (this.prefix === dash(SCROLL, PADDING) + ':' || this.prefix === dash(SCROLL, 'p:')) ? -1 : 0;
    }
}