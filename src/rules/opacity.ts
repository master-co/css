import { OPACITY } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'Opacity'
    static override propName = OPACITY;
    static override unit = '';
}