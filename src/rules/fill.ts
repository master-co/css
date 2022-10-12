import { FILL } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'Fill'
    static override propName = FILL;
    static override colorStarts = 'fill:';
    static override colorful = true;
}