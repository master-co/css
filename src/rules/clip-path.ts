import { BORDER, BOX, CLIP, CONTENT, dash, FILL, MARGIN, PADDING, STROKE, VIEW } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class ClipPath extends MasterCSSRule {
    static override matches = /^clip:./
    static override propName = dash(CLIP, 'path');
}