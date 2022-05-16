import { BORDER, BOX, CONTENT, dash, FILL, STROKE, TRANSFORM, VIEW } from '../constants/css-property-keyword';
import { Style } from '@master/style';

export class TransformBox extends Style {
    static override matches = /^transform:(content|border|fill|stroke|view)(?!;)/;
    static override key = dash(TRANSFORM, BOX);
    static override values = {
        content: dash(CONTENT, BOX),
        border: dash(BORDER, BOX),
        fill: dash(FILL, BOX),
        stroke: dash(STROKE, BOX),
        view: dash(VIEW, BOX)
    }
}