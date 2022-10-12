import { STROKE } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'Stroke'
    static override propName = STROKE;
    static override colorful = true;
}