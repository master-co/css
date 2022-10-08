import { MasterCSSRule } from '../rule';
import { dash, MARGIN, SCROLL } from '../constants/css-property-keyword';
import { B, BOTTOM, L, LEFT, R, RIGHT, T, TOP, X, Y } from '../constants/direction';

export class ScrollMargin extends MasterCSSRule {
    static id = 'scrollMargin';
    static override matches = /^scroll-m([xytblr]|argin(-(top|bottom|left|right))?)?:./;
    override get(declaration): { [key: string]: any } {
        if (this.prefix.slice(-3, -2) === 'm') {
            const SCROLL_MARGIN_PREFIX = dash(SCROLL, MARGIN) + '-',
                SCROLL_MARGIN_LEFT = SCROLL_MARGIN_PREFIX + LEFT,
                SCROLL_MARGIN_RIGHT = SCROLL_MARGIN_PREFIX + RIGHT,
                SCROLL_MARGIN_TOP = SCROLL_MARGIN_PREFIX + TOP,
                SCROLL_MARGIN_BOTTOM = SCROLL_MARGIN_PREFIX + BOTTOM;

            switch (this.prefix.slice(-2, -1)) {
                case X:
                    return {
                        [SCROLL_MARGIN_LEFT]: declaration,
                        [SCROLL_MARGIN_RIGHT]: declaration
                    }
                case Y:
                    return {
                        [SCROLL_MARGIN_TOP]: declaration,
                        [SCROLL_MARGIN_BOTTOM]: declaration
                    }
                case L:
                    return {
                        [SCROLL_MARGIN_LEFT]: declaration
                    }
                case R:
                    return {
                        [SCROLL_MARGIN_RIGHT]: declaration
                    }
                case T:
                    return {
                        [SCROLL_MARGIN_TOP]: declaration
                    }
                case B:
                    return {
                        [SCROLL_MARGIN_BOTTOM]: declaration
                    }
            }
        } else {
            return {
                [this.prefix.replace(/-m(?!argin)/, '-' + MARGIN).slice(0, -1)]: declaration
            }
        }
    }
    override get order(): number {
        return (this.prefix === dash(SCROLL, MARGIN) + ':' || this.prefix === dash(SCROLL, 'm:')) ? -1 : 0;
    }
}