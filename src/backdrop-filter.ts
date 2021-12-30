import { Style } from '@master/style';

export class BackdropFilterStyle extends Style {
    static override matches = /^(bd|backdrop-filter):./;
    override get props(): { [key: string]: any } {
        return {
            'backdrop-filter': this,
            '-webkit-backdrop-filter': this
        }
    };
}