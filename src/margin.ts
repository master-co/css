import { Style } from '@master/style';

export class MarginStyle extends Style {
    static override prefixes = /^margin(-(left|right|top|bottom))?:/;
    static override supportFullName = false;
    override get properties(): { [key: string]: any } {
        return {
            [this.prefix.slice(0, -1)]: this
        }
    }
}