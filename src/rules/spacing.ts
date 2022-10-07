import { MasterCSSRule } from '../rule';
import { dash, MARGIN, PADDING } from '../constants/css-property-keyword';
import { B, BOTTOM, L, LEFT, R, RIGHT, T, TOP, X, Y } from '../constants/direction';

export class Spacing extends MasterCSSRule {
    static override id = 'spacing';
    static override matches = /^[pm][xytblr]?:./;
    override getProps(propertyInfo): { [key: string]: any } {
        const charAt1 = this.prefix[0];
        const SPACING = charAt1 === 'm' ? MARGIN : PADDING;
        const SPACING_LEFT = dash(SPACING, LEFT);
        const SPACING_RIGHT = dash(SPACING, RIGHT);
        const SPACING_TOP = dash(SPACING, TOP);
        const SPACING_BOTTOM = dash(SPACING, BOTTOM);
        switch (this.prefix[1]) {
            case X:
                return {
                    [SPACING_LEFT]: propertyInfo,
                    [SPACING_RIGHT]: propertyInfo
                }
            case Y:
                return {
                    [SPACING_TOP]: propertyInfo,
                    [SPACING_BOTTOM]: propertyInfo
                }
            case L:
                return {
                    [SPACING_LEFT]: propertyInfo
                }
            case R:
                return {
                    [SPACING_RIGHT]: propertyInfo
                }
            case T:
                return {
                    [SPACING_TOP]: propertyInfo
                }
            case B:
                return {
                    [SPACING_BOTTOM]: propertyInfo
                }
            default:
                return {
                    [SPACING]: propertyInfo
                }
        }
    }
    override get order(): number {
        return (this.prefix === 'p:' || this.prefix === 'm:') ? -1 : 0;
    }
}