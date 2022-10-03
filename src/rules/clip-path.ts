import { BORDER, BOX, CLIP, CONTENT, dash, FILL, MARGIN, PADDING, STROKE, VIEW } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class ClipPath extends MasterCSSRule {
    static override matches = /^clip:./
    static override key = dash(CLIP, 'path');
    static override values = {
        content: dash(CONTENT, BOX),
        border: dash(BORDER, BOX),
        padding: dash(PADDING, BOX),
        margin: dash(MARGIN, BOX),
        fill: dash(FILL, BOX),
        stroke: dash(STROKE, BOX),
        view: dash(VIEW, BOX)
    }
}