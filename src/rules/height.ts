import { HEIGHT, SIZING_VALUES } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class Height extends MasterCSSRule {
    static override matches = /^h:./;
    static override key = HEIGHT;
    static override values = SIZING_VALUES;

}