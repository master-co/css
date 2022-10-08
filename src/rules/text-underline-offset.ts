import { dash, OFFSET, TEXT, UNDERLINE } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class TextUnderlineOffset extends MasterCSSRule {
    static override propName = dash(TEXT, UNDERLINE, OFFSET);
}