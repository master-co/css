import { MasterCSSRule } from '../rule';
import { RESIZE } from '../constants/css-property-keyword';

export default class extends MasterCSSRule {
    static override id = 'Resize'
    static override propName = RESIZE;
}