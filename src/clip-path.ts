import { BORDER, BOX, CLIP, CONTENT, DASH, FILL, MARGIN, PADDING, STROKE, VIEW } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class ClipPathStyle extends Style {
    static override matches = /^clip:./
    static override key = CLIP + DASH + 'path';
    static override values = {
        content: CONTENT + DASH + BOX,
        border: BORDER + DASH + BOX,
        padding: PADDING + DASH + BOX,
        margin: MARGIN + DASH + BOX,
        fill: FILL + DASH + BOX,
        stroke: STROKE + DASH + BOX,
        view: VIEW + DASH + BOX
    }
}