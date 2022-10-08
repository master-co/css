import { COLUMN, dash, GAP, ROW, X, Y } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class Gap extends MasterCSSRule {
    static id = 'gap';
    static override matches = /^gap(-x|-y)?:./;
    override get(declaration): { [key: string]: any } {
        switch (this.prefix[4]) {
            case X:
                return { [dash(COLUMN, GAP)]: declaration };
            case Y:
                return { [dash(ROW, GAP)]: declaration };
            default:
                return { [GAP]: declaration };
        }
    }
    override order = -1;
}