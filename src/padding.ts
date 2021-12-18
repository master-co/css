import { Style } from '@master/style';

export class PaddingStyle extends Style {
    static override prefixes = /^padding(-(left|right|top|bottom))?:/;
    override get properties(): { [key: string]: any } {
        return {
            [this.prefix.slice(0, -1)]: this
        }
    }
}