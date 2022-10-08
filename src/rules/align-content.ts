import { ALIGN, CONTENT, dash } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class AlignContent extends MasterCSSRule {
    static override matches =  /^ac:./;
    static override propName = dash(ALIGN, CONTENT);
}