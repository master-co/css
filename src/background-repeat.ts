import { Style } from '@master/style';
import { BACKGROUND, DASH, REPEAT } from './constants/css-property-keyword';

export class BackgroundRepeatStyle extends Style {
    static override matches =  /^(bg-repeat:.|(bg|background):(repeat|no-repeat|repeat-x|repeat-y)(?!;))/;
    static override key = BACKGROUND + DASH + REPEAT;
}