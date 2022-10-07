import { MAX_HEIGHT } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class MaxHeight extends MasterCSSRule {
    static override matches = /^max-h:./;
    static override key = MAX_HEIGHT;
}