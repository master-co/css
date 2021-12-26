import { Style } from '@master/style';
import { BORDER, DASH } from './constants/css-property-keyword';
import { B, BOTTOM, L, LEFT, R, RIGHT, T, TOP, X, Y } from './constants/direction';

export class BorderStyle extends Style {
    static override matches = /^b((x|y|t|b|l|r)?|(order)?(-(left|right|top|bottom))?):./;
    override get props(): { [key: string]: any } {
        const direction = /^b(order)?-?(.)?/.exec(this.prefix)[2];
        const BORDER_LEFT = BORDER + DASH + LEFT;
        const BORDER_RIGHT = BORDER + DASH + RIGHT;
        const BORDER_TOP = BORDER + DASH + TOP;
        const BORDER_BOTTOM = BORDER + DASH + BOTTOM;
        switch (direction) {
            case X:
                return {
                    [BORDER_LEFT]: this,
                    [BORDER_RIGHT]: this
                }
            case Y:
                return {
                    [BORDER_TOP]: this,
                    [BORDER_BOTTOM]: this
                }
            case L:
                return {
                    [BORDER_LEFT]: this
                }
            case R:
                return {
                    [BORDER_RIGHT]: this
                }
            case T:
                return {
                    [BORDER_TOP]: this
                }
            case B:
                return {
                    [BORDER_BOTTOM]: this
                }
            default:
                return {
                    [BORDER]: this
                }
        }
    }
}