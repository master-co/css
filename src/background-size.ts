import { Style } from '@master/style';
import { BACKGROUND, DASH, SIZE } from './constants/css-property-keyword';

export class BackgroundSize extends Style {
    static override matches = /^(bg|background):((auto|cover|contain)(?!;)|\.?\d((?!;).)*$)/;
    static override key = BACKGROUND + DASH + SIZE;
}