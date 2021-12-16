import { Style } from '@master/style';
import { BACKGROUND } from './constants/css-property-keyword';

export class BackgroundStyle extends Style {
    static override prefixes = /^bg:/;
    static override properties = [BACKGROUND];
}