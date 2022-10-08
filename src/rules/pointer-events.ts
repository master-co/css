import { MasterCSSRule } from '../rule';
import { dash, EVENTS, POINTER } from '../constants/css-property-keyword';

export class PointerEvents extends MasterCSSRule {
    static override propName = dash(POINTER, EVENTS);
}