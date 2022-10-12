import { ALIGN, CONTENT, dash } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'AlignContent'
    static override matches =  /^ac:./;
    static override propName = dash(ALIGN, CONTENT);
}