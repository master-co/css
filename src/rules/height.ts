import { HEIGHT } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class Height extends MasterCSSRule {
    static override matches = /^h:./;
    static override propName = HEIGHT;

}