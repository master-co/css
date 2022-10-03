import { STROKE } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class Stroke extends MasterCSSRule {
    static override key = STROKE;
    static override colorful = true;
}