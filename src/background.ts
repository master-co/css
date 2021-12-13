import { MasterStyle } from '@master/style';
import { BACKGROUND } from './constants/css-property-keyword';

export class BackgroundStyle extends MasterStyle {
    static override prefixes = /^bg:/;
    static override properties = [BACKGROUND];
}