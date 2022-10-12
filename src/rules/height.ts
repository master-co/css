import { HEIGHT } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'Height'
    static override matches = /^h:./;
    static override propName = HEIGHT;

}