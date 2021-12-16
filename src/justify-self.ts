import { DASH, JUSTIFY, SELF } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class JustifySelfStyle extends Style {
    static override properties = [JUSTIFY + DASH + SELF];
}