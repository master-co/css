import { MasterCSSRule } from '../rule';
import { dash, SHADOW, TEXT } from '../constants/css-property-keyword';

export default class extends MasterCSSRule {
    static override id = 'TextShadow'
    static override propName = dash(TEXT, SHADOW);
    static override colorful = true;
}