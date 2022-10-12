import { MAX_HEIGHT } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'MaxHeight'
    static override matches = /^max-h:./;
    static override propName = MAX_HEIGHT;
}