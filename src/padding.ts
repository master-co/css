import { Style } from '@master/style';

export class PaddingStyle extends Style {
    static override matches = /^padding(-(left|right|top|bottom))?:/;
    override get props(): { [key: string]: any } {
        return {
            [this.prefix.slice(0, -1)]: this
        }
    }
}