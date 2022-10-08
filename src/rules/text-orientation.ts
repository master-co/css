import { dash, TEXT } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class TextOrientation extends MasterCSSRule {
    static override matches = /^t(ext)?:(mixed|upright|sideways-right|sideways|use-glyph-orientation)(?!\|)/;
    static override propName = dash(TEXT, 'orientation');
}