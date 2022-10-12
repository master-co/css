import { MasterCSSRule } from '../rule';
import { CONTENT } from '../constants/css-property-keyword';

export default class extends MasterCSSRule {
    static override id = 'Content'
    static override propName = CONTENT;
}