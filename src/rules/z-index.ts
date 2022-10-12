import { Z_INDEX } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'ZIndex'
    static override matches = /^z:./;
    static override propName = Z_INDEX;
    static override unit = '';
}