import { MasterCSSRule } from '../rule';
import { dash, TEXT } from '../constants/css-property-keyword';

export default class extends MasterCSSRule {
    static override id = 'TextRendering'
    static override matches = /^t(ext)?:(optimizeSpeed|optimizeLegibility|geometricPrecision)(?!\|)/;
    static override propName = dash(TEXT, 'rendering');
}