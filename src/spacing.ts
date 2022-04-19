import { Style } from '@master/style';
import { DASH, MARGIN, PADDING } from './constants/css-property-keyword';
import { B, BOTTOM, L, LEFT, R, RIGHT, T, TOP, X, Y } from './constants/direction';

// TODO: id
export class Spacing extends Style {
    static override matches = /^[pm][xytblr]?:./;
    override get props(): { [key: string]: any } {
        const charAt1 = this.prefix[0];
        const SPACING = charAt1 === 'm' ? MARGIN : PADDING;
        const SPACING_LEFT = SPACING + DASH + LEFT;
        const SPACING_RIGHT = SPACING + DASH + RIGHT;
        const SPACING_TOP = SPACING + DASH + TOP;
        const SPACING_BOTTOM = SPACING + DASH + BOTTOM;
        switch (this.prefix[1]) {
            case X:
                return {
                    [SPACING_LEFT]: this,
                    [SPACING_RIGHT]: this
                }
            case Y:
                return {
                    [SPACING_TOP]: this,
                    [SPACING_BOTTOM]: this
                }
            case L:
                return {
                    [SPACING_LEFT]: this
                }
            case R:
                return {
                    [SPACING_RIGHT]: this
                }
            case T:
                return {
                    [SPACING_TOP]: this
                }
            case B:
                return {
                    [SPACING_BOTTOM]: this
                }
            default:
                return {
                    [SPACING]: this
                }
        }
    }
    override get order(): number {
        return (this.prefix === 'p:' || this.prefix === 'm:') ? -1 : 0;
    }
}