import { dash, INDENT, TEXT } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class TextIndent extends MasterCSSRule {
    static override propName = dash(TEXT, INDENT);
}