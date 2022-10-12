import { dash, OVERSCROLL_BEHAVIOR, X, Y } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'OverscrollBehavior'
    static override matches = /^overscroll-behavior(?:-[xy])?:/;
    override get(declaration): { [key: string]: any } {
        switch (this.prefix.slice(-2, -1)) {
            case X:
                return { [dash(OVERSCROLL_BEHAVIOR, X)]: declaration };
            case Y:
                return { [dash(OVERSCROLL_BEHAVIOR, Y)]: declaration };
            default:
                return { [OVERSCROLL_BEHAVIOR]: declaration };
        }
    }
}