import { Style } from '@master/style';

export class BoxDecorationBreak extends Style {
    static override matches = /^box-decoration-break:|box:(slice|clone)(?!;)/;
    override get props(): { [key: string]: any } {
        return {
            'box-decoration-break': this,
            '-webkit-box-decoration-break': this
        }
    };
}