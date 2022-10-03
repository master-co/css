import { MAX_HEIGHT, SIZING_VALUES } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class MaxHeight extends MasterCSSRule {
    static override matches = /^max-h:./;
    static override key = MAX_HEIGHT;
    static override values = SIZING_VALUES;
}