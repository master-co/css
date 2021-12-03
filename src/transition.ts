import { TRANSITION } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

export class MasterTransitionStyle extends MasterStyle {
    static override prefixes =  /^transition:/;
    static override symbol = '~'; 
    static override properties = [TRANSITION];
}