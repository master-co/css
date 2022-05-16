import { Style } from '../style';
import { dash, DRAG, USER } from '../constants/css-property-keyword';

export class UserDrag extends Style {
    static override key = dash(USER, DRAG);
    override get props(): { [key: string]: any } {
        return {
            'user-drag': this,
            '-webkit-user-drag': this
        }
    };
}