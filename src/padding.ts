import { MasterStyle } from '@master/style';

export class PaddingStyle extends MasterStyle {
    static override prefixes = /^padding(-(left|right|top|bottom))?:/;
    static override supportFullName = false;
    override get properties(): { [key: string]: any } {
        return {
            [this.prefix.slice(0, -1)]: this
        }
    }
}