import { DIRECTION } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'Direction'
    static override propName = DIRECTION;
}