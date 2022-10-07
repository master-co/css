import { COLUMN, dash, GAP, ROW, X, Y } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class Gap extends MasterCSSRule {
    static id = 'gap';
    static override matches = /^gap(-x|-y)?:./;
    override getProps(propertyInfo): { [key: string]: any } {
        switch (this.prefix[4]) {
            case X:
                return { [dash(COLUMN, GAP)]: propertyInfo };
            case Y:
                return { [dash(ROW, GAP)]: propertyInfo };
            default:
                return { [GAP]: propertyInfo };
        }
    }
    override order = -1;
}