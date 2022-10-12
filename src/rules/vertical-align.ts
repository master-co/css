import { ALIGN, dash, VERTICAL } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'VerticalAlign'
    static override matches = /^(?:v|vertical):./;
    static override propName = dash(VERTICAL, ALIGN);
}