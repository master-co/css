import { BOX, dash, TRANSFORM } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class TransformBox extends MasterCSSRule {
    static override matches = /^transform:(content|border|fill|stroke|view)(?!\|)/;
    static override key = dash(TRANSFORM, BOX);
}