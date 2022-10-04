import { MasterCSSRule } from '../rule';
import { SQUARE, VIDEO, ASPECT, RATIO, dash } from '../constants/css-property-keyword';

export class AspectRadio extends MasterCSSRule {
    static override matches = /^aspect:./;
    static override key = dash(ASPECT, RATIO);
    static override unit = '';
}