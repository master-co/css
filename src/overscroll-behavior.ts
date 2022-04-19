import { dash, OVERSCROLL_BEHAVIOR, X, Y } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class OverscrollBehavior extends Style {
    static id = 'overscrollBehavior';
    static override matches = /^overscroll-behavior(?:-[xy])?:/;
    override get props(): { [key: string]: any } {
        switch (this.prefix.slice(-2, -1)) {
            case X:
                return { [dash(OVERSCROLL_BEHAVIOR, X)]: this };
            case Y:
                return { [dash(OVERSCROLL_BEHAVIOR, Y)]: this };
            default:
                return { [OVERSCROLL_BEHAVIOR]: this };
        }
    }
}