import { Style } from '@master/style';
import { BACKGROUND, COLOR, DASH } from './constants/css-property-keyword';

export class BackgroundColorStyle extends Style {
    static override prefixes = /^(bg-color:|(bg|background):transparent)/;
    static override key = BACKGROUND + DASH + COLOR;
}