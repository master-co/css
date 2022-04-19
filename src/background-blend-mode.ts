import { Style } from '@master/style';
import { BACKGROUND, BLEND, DASH, MODE } from './constants/css-property-keyword';

export class BackgroundBlendMode extends Style {
    static override key = BACKGROUND + DASH + BLEND + DASH + MODE;
}