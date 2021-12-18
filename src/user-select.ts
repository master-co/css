import { Style } from '@master/style';

export class UserSelectStyle extends Style {
    static override prefixes = /^user-select:/;
    override get props(): { [key: string]: any } {
        return {
            'user-select': this,
            '-webkit-user-select': this
        }
    };
}