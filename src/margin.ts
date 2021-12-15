import { MasterStyle } from '@master/style';

export class MarginStyle extends MasterStyle {
    static override prefixes = /^margin(-(left|right|top|bottom))?:/;
    static override supportFullName = false;
    override get properties(): { [key: string]: any } {
        return {
            [this.prefix.slice(0, -1)]: this
        }
    }
}