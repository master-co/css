import { dash, OVERSCROLL_BEHAVIOR, X, Y } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class OverscrollBehavior extends MasterCSSRule {
    static id = 'overscrollBehavior';
    static override matches = /^overscroll-behavior(?:-[xy])?:/;
    override getProps(propertyInfo): { [key: string]: any } {
        switch (this.prefix.slice(-2, -1)) {
            case X:
                return { [dash(OVERSCROLL_BEHAVIOR, X)]: propertyInfo };
            case Y:
                return { [dash(OVERSCROLL_BEHAVIOR, Y)]: propertyInfo };
            default:
                return { [OVERSCROLL_BEHAVIOR]: propertyInfo };
        }
    }
}