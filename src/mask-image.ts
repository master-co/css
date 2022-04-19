import { Style } from '@master/style';

export class MaskImage extends Style {
    static id = 'maskImage';
    static override matches = /^mask-image:./;
    override get props(): { [key: string]: any } {
        return {
            'mask-image': this,
            '-webkit-mask-image': this
        }
    }
}