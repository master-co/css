import { ALIGN, dash, VERTICAL } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class VerticalAlign extends MasterCSSRule {
    static override matches = /^(?:v|vertical):./;
    static override propName = dash(VERTICAL, ALIGN);
}