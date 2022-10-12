import { dash, ITEMS, JUSTIFY } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'JustifyItems'
    static override matches =  /^ji:./;
    static override propName = dash(JUSTIFY, ITEMS);

}