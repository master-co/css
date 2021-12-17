import { DASH, OVERFLOW, X, Y } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class OverflowStyle extends Style {
    static override prefixes = /^(overflow|ovf)(-x|-y)?:/;
    static override supportFullName = false;
    override get properties(): { [key: string]: any } {
        switch (this.prefix.slice(-2, -1)) {
            case X:
                return { 'overflow-x': this };
            case Y:
                return { 'overflow-y': this };
            default:
                return { 'overflow': this };
        }
    }
}