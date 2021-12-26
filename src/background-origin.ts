import { Style } from '@master/style';
import { BACKGROUND, DASH, ORIGIN } from './constants/css-property-keyword';

export class BackgroundOriginStyle extends Style {
    static override matches = /^bg-origin:./;
    static override key = BACKGROUND + DASH + ORIGIN;
}