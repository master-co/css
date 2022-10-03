import { dash, OBJECT, POSITION } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class ObjectPosition extends MasterCSSRule {
    static override matches = /^(object|obj):(top|bottom|right|left|center)/;
    static override key = dash(OBJECT, POSITION);
}