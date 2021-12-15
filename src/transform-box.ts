import { BOX, DASH, TRANSFORM } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

export class TransformBoxStyle extends MasterStyle {
    static override prefixes =  /^transform:(content-box|border-box|fill-box|stroke-box|view-box)/;
    static override properties = [TRANSFORM + DASH + BOX];
}