import { BOX, DASH, TRANSFORM } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class TransformBoxStyle extends Style {
    static override matches =  /^transform:(content-box|border-box|fill-box|stroke-box|view-box)$/;
    static override key = TRANSFORM + DASH + BOX;
}