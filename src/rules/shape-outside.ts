import { MasterCSSRule } from '../rule';
import { BORDER, BOX, CONTENT, dash, MARGIN, PADDING, SHAPE } from '../constants/css-property-keyword';

export class ShapeOutside extends MasterCSSRule {
    static override matches = /^shape:((margin|content|border|padding)(?!\|)|(inset|circle|ellipse|polygon|url|linear-gradient)\(.*\)((?!\|).)*$)/
    static override key = dash(SHAPE, 'outside');
}