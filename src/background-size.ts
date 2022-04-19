import { Style } from '@master/style';
import { BACKGROUND, dash, SIZE } from './constants/css-property-keyword';

export class BackgroundSize extends Style {
    static override matches = /^(bg|background):((auto|cover|contain)(?!;)|\.?\d((?!;).)*$)/;
    static override key = dash(BACKGROUND, SIZE);
}