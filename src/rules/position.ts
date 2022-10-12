import { ABSOLUTE, POSITION, RELATIVE } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'Position'
    static override propName = POSITION;
}