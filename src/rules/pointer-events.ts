import { MasterCSSRule } from '../rule';
import { dash, EVENTS, POINTER } from '../constants/css-property-keyword';

export default class extends MasterCSSRule {
    static override id = 'PointerEvents'
    static override propName = dash(POINTER, EVENTS);
}