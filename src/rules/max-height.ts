import { MAX_HEIGHT } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class MaxHeight extends MasterCSSRule {
    static override matches = /^max-h:./;
    static override propName = MAX_HEIGHT;
}