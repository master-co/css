import { Z_INDEX } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class ZIndex extends MasterCSSRule {
    static override matches = /^z:./;
    static override propName = Z_INDEX;
    static override unit = '';
}