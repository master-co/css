import { dash, ITEMS, JUSTIFY } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class JustifyItems extends MasterCSSRule {
    static override matches =  /^ji:./;
    static override key = dash(JUSTIFY, ITEMS);

}