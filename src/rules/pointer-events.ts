import { MasterCSSRule } from '../rule';
import { dash, EVENTS, POINTER } from '../constants/css-property-keyword';

export class PointerEvents extends MasterCSSRule {
    static override key = dash(POINTER, EVENTS);
    static override semantics = {
        untouchable: 'none'
    }
}