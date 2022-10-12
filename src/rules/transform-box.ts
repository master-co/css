import { BOX, dash, TRANSFORM } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'TransformBox'
    static override matches = /^transform:(content|border|fill|stroke|view)(?!\|)/;
    static override propName = dash(TRANSFORM, BOX);
}