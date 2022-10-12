import { MAX_WIDTH } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'MaxWidth'
    static override matches = /^max-w:./;
    static override propName = MAX_WIDTH;
}