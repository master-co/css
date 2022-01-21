import { BORDER, BOX, CONTENT, DASH, FILL, STROKE, TRANSFORM, VIEW } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class TransformBoxStyle extends Style {
    static override matches =  /^transform:(content|border|fill|stroke|view)(?!;)/;
    static override key = TRANSFORM + DASH + BOX;
    static override values = {
        content: CONTENT + DASH + BOX,
        border: BORDER + DASH + BOX,
        fill: FILL + DASH + BOX,
        stroke: STROKE + DASH + BOX,
        view: VIEW + DASH + BOX
    }
}