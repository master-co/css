import { MIN_HEIGHT, SIZING_VALUES } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class MinHeight extends MasterCSSRule {
    static override matches = /^min-h:./;
    static override key = MIN_HEIGHT;
    static override values = SIZING_VALUES;
}