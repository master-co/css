import { MIN_WIDTH } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

export class MasterMinWidthStyle extends MasterStyle {
    static override prefixes =  /^min-w:/;
    static override properties = [MIN_WIDTH];
}