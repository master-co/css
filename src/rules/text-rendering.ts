import { MasterCSSRule } from '../rule';
import { dash, TEXT } from '../constants/css-property-keyword';

export class TextRendering extends MasterCSSRule {
    static override matches = /^t(ext)?:(optimizeSpeed|optimizeLegibility|geometricPrecision)(?!\|)/;
    static override key = dash(TEXT, 'rendering');
}