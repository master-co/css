import { MasterCSSRule } from '../rule';
import { CONTAIN } from '../constants/css-property-keyword';

export default class extends MasterCSSRule {
    static override id = 'Contain'
    static override propName = CONTAIN;
}