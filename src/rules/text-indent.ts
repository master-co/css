import { dash, INDENT, TEXT } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'TextIndent'
    static override propName = dash(TEXT, INDENT);
}