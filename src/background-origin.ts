import { MasterStyle } from '@master/style';
import { BACKGROUND, DASH, ORIGIN } from './constants/css-property-keyword';

export class BackgroundOriginStyle extends MasterStyle {
    static override prefixes = /^bg-origin:/;
    static override properties = [BACKGROUND + DASH + ORIGIN];
}