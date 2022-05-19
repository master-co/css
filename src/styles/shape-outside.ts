import { Style } from '../style';
import { BORDER, BOX, CONTENT, dash, MARGIN, PADDING, SHAPE } from '../constants/css-property-keyword';

export class ShapeOutside extends Style {
    static override matches = /^shape:((margin|content|border|padding)(?!\|)|(inset|circle|ellipse|polygon|url|linear-gradient)\(.*\)((?!\|).)*$)/
    static override key = dash(SHAPE, 'outside');
    static override values = {
        content: dash(CONTENT, BOX),
        border: dash(BORDER, BOX),
        padding: dash(PADDING, BOX),
        margin: dash(MARGIN, BOX)
    }
}