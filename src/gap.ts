import { COLUMN, DASH, GAP, ROW, X, Y } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

export class MasterGapStyle extends MasterStyle {
    static override prefixes = /^gap(-x|-y)?:/;
    override get properties(): { [key: string]: any } {
        switch (this.prefix[4]) {
            case X:
                return { [COLUMN + DASH + GAP]: this };
            case Y:
                return { [ROW + DASH + GAP]: this };
            default:
                return { [GAP]: this };
        }
    }
}