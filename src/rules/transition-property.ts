import { dash, PROPERTY, TRANSITION } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class TransitionProperty extends MasterCSSRule {
    static override matches = /^~property:./;
    static override propName = dash(TRANSITION, PROPERTY);
}