import { MasterCSSRule } from '../rule';
import { BORDER, BOX, CONTENT, dash, MARGIN, PADDING, SHAPE } from '../constants/css-property-keyword';

export default class extends MasterCSSRule {
    static override id = 'ShapeOutside'
    static override matches = /^shape:((margin|content|border|padding)(?!\|)|(inset|circle|ellipse|polygon|url|linear-gradient)\(.*\)((?!\|).)*$)/
    static override propName = dash(SHAPE, 'outside');
}