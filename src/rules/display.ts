import { DISPLAY } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class Display extends MasterCSSRule {
    static override matches = /^d:./;
    static override propName = DISPLAY;
}