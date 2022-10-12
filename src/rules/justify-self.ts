import { dash, JUSTIFY, SELF } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'JustifySelf'
    static override matches =  /^js:./;
    static override propName = dash(JUSTIFY, SELF);
}