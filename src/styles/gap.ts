import { COLUMN, dash, GAP, ROW, X, Y } from '../constants/css-property-keyword';
import { Style } from '@master/style';

export class Gap extends Style {
    static id = 'gap';
    static override matches = /^gap(-x|-y)?:./;
    override get props(): { [key: string]: any } {
        switch (this.prefix[4]) {
            case X:
                return { [dash(COLUMN, GAP)]: this };
            case Y:
                return { [dash(ROW, GAP)]: this };
            default:
                return { [GAP]: this };
        }
    }
    override order = -1;
}