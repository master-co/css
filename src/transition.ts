import { TRANSITION } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class TransitionStyle extends Style {
    static override symbol = '~'; 
    static override key = TRANSITION;
    override order = -1;
}