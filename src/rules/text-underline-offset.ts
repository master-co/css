import { dash, OFFSET, TEXT, UNDERLINE } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'TextUnderlineOffset'
    static override propName = dash(TEXT, UNDERLINE, OFFSET);
}