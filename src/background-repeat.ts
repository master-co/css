import { Style } from '@master/style';
import { BACKGROUND, DASH, REPEAT } from './constants/css-property-keyword';

export class BackgroundRepeatStyle extends Style {
    static override prefixes =  /^(bg-repeat:|bg:(repeat|no-repeat|repeat-x|repeat-y))/;
    static override properties = [BACKGROUND + DASH + REPEAT];
}