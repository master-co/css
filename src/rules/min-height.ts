import { MIN_HEIGHT } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'MinHeight'
    static override matches = /^min-h:./;
    static override propName = MIN_HEIGHT;
}