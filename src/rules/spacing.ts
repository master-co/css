import { MasterCSSRule } from '../rule';
import { dash, MARGIN, PADDING } from '../constants/css-property-keyword';
import { B, BOTTOM, L, LEFT, R, RIGHT, T, TOP, X, Y } from '../constants/direction';

export default class extends MasterCSSRule {
    static override id = 'Spacing'
    static override matches = /^[pm][xytblr]?:./;
    override get(declaration): { [key: string]: any } {
        const charAt1 = this.prefix[0];
        const SPACING = charAt1 === 'm' ? MARGIN : PADDING;
        const SPACING_LEFT = dash(SPACING, LEFT);
        const SPACING_RIGHT = dash(SPACING, RIGHT);
        const SPACING_TOP = dash(SPACING, TOP);
        const SPACING_BOTTOM = dash(SPACING, BOTTOM);
        switch (this.prefix[1]) {
            case X:
                return {
                    [SPACING_LEFT]: declaration,
                    [SPACING_RIGHT]: declaration
                }
            case Y:
                return {
                    [SPACING_TOP]: declaration,
                    [SPACING_BOTTOM]: declaration
                }
            case L:
                return {
                    [SPACING_LEFT]: declaration
                }
            case R:
                return {
                    [SPACING_RIGHT]: declaration
                }
            case T:
                return {
                    [SPACING_TOP]: declaration
                }
            case B:
                return {
                    [SPACING_BOTTOM]: declaration
                }
            default:
                return {
                    [SPACING]: declaration
                }
        }
    }
    override get order(): number {
        return (this.prefix === 'p:' || this.prefix === 'm:') ? -1 : 0;
    }
}