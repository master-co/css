import { dash, OBJECT, POSITION } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'ObjectPosition'
    static override matches = /^(object|obj):(top|bottom|right|left|center)/;
    static override propName = dash(OBJECT, POSITION);
}