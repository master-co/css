import { TRANSITION } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class TransitionStyle extends Style {
    static override symbol = '~'; 
    static override key = TRANSITION;
    override get getOrder(): number {
        return -1;
    }
}