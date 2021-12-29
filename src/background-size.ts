import { Style } from '@master/style';
import { BACKGROUND, DASH, SIZE } from './constants/css-property-keyword';

export class BackgroundSizeStyle extends Style {
    static override matches =  /^(bg-size:.|(bg|background):(auto|cover|contain)(?!;))/;
    static override key = BACKGROUND + DASH + SIZE;
}