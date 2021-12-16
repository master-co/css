import { CONTENT, DASH, JUSTIFY } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class JustifyContentStyle extends Style {
    static override properties = [JUSTIFY + DASH + CONTENT];

}