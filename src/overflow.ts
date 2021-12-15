import { DASH, OVERFLOW, X, Y } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

export class OverflowStyle extends MasterStyle {
    static override prefixes = /^(overflow|ovf)(-x|-y)?:/;
    static override supportFullName = false;
    override get properties(): { [key: string]: any } {
        switch (this.prefix.slice(-2, -1)) {
            case X:
                return { [OVERFLOW + DASH + X]: this };
            case Y:
                return { [OVERFLOW + DASH + Y]: this };
            default:
                return { [OVERFLOW]: this };
        }
    }
}