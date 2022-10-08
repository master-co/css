import { FILL } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class Fill extends MasterCSSRule {
    static override propName = FILL;
    static override colorStarts = 'fill:';
    static override colorful = true;
}