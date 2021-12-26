import { Style } from '@master/style';

export class MarginStyle extends Style {
    static override matches = /^margin(-(left|right|top|bottom))?:/;
    override get props(): { [key: string]: any } {
        return {
            [this.prefix.slice(0, -1)]: this
        }
    }
}