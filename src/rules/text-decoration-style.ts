import { dash, DECORATION, STYLE, TEXT } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'TextDecorationStyle'
    static override matches = /^t(ext)?:(solid|double|dotted|dashed|wavy)(?!\|)/;
    static override propName = dash(TEXT, DECORATION, STYLE);
}