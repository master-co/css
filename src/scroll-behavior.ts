import { BEHAVIOR, DASH, SCROLL } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

export class ScrollBehaviorStyle extends MasterStyle {
    static override properties = [SCROLL + DASH + BEHAVIOR];
}