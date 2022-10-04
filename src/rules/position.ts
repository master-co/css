import { ABSOLUTE, POSITION, RELATIVE } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class Position extends MasterCSSRule {
    static override key = POSITION;
}