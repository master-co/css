import { ALIGN, dash, TEXT } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class TextAlign extends MasterCSSRule {
    static override matches = /^t(ext)?:(justify|center|left|right|start|end)(?!\|)/;
    static override key = dash(TEXT, ALIGN);
}