import { BORDER, BOX, CONTENT, dash, FILL, STROKE, TRANSFORM, VIEW } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class TransformBox extends MasterCSSRule {
    static override matches = /^transform:(content|border|fill|stroke|view)(?!\|)/;
    static override key = dash(TRANSFORM, BOX);
    static override values = {
        content: dash(CONTENT, BOX),
        border: dash(BORDER, BOX),
        fill: dash(FILL, BOX),
        stroke: dash(STROKE, BOX),
        view: dash(VIEW, BOX)
    }
}