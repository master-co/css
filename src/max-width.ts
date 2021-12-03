import { MAX_WIDTH } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

export class MasterMaxWidthStyle extends MasterStyle {
    static override prefixes =  /^max-w:/;
    static override properties = [MAX_WIDTH];
}