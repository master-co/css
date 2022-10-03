import { Z_INDEX } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class ZIndex extends MasterCSSRule {
    static override matches = /^z:./;
    static override key = Z_INDEX;
    static override unit = '';
}