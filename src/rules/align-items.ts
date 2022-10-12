import { ALIGN, dash, ITEMS } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'AlignItems'
    static override matches =  /^ai:./;
    static override propName = dash(ALIGN, ITEMS);
}