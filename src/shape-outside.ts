import { Style } from '@master/style';
import { BORDER, BOX, CONTENT, DASH, MARGIN, PADDING, SHAPE } from './constants/css-property-keyword';

export class ShapeOutsideStyle extends Style {
    static override matches = /^shape:((margin|content|border|padding)(?!;)|(inset|circle|ellipse|polygon|url|linear-gradient)\(.*\)((?!;).)*)$/
    static override key = SHAPE + DASH + 'outside';
    static override values = {
        content: CONTENT + DASH + BOX,
        border: BORDER + DASH + BOX,
        padding: PADDING + DASH + BOX,
        margin: MARGIN + DASH + BOX
    }
}