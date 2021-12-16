import { MasterStyle } from '@master/style';
import { BACKGROUND, DASH, REPEAT } from './constants/css-property-keyword';

export class BackgroundRepeatStyle extends MasterStyle {
    static override prefixes =  /^((bg|background)-repeat:|(bg|background):(repeat|no-repeat|repeat-x|repeat-y))/;
    static override properties = [BACKGROUND + DASH + REPEAT];
    static override supportFullName = false;
}