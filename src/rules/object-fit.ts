import { dash, FIT, OBJECT } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class ObjectFit extends MasterCSSRule {
    static override matches = /^(object|obj):(contain|cover|fill|scale-down)/;
    static override key = dash(OBJECT, FIT);
}