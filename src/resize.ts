import { MasterStyle } from '@master/style';
import { RESIZE } from './constants/css-property-keyword';

export class ResizeStyle extends MasterStyle {
    static override properties = [RESIZE];
}