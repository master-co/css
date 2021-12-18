import { Style } from '@master/style';

export class UserDragStyle extends Style {
    static override prefixes = /^user-drag:/;
    override get props(): { [key: string]: any } {
        return {
            'user-drag': this,
            '-webkit-user-drag': this
        }
    };
}