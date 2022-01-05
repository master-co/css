import { Style } from '@master/style';
import { BACKGROUND, DASH, ORIGIN } from './constants/css-property-keyword';

export class BackgroundOriginStyle extends Style {
    static override key = BACKGROUND + DASH + ORIGIN;
}