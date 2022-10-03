import { OPACITY } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class Opacity extends MasterCSSRule {
    static override key = OPACITY;
    static override unit = '';
}