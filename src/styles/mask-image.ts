import { Style } from '../style';
import { dash, IMAGE } from '../constants/css-property-keyword';

export class MaskImage extends Style {
    static override key = dash('mask', IMAGE)
    override get props(): { [key: string]: any } {
        return {
            'mask-image': this,
            '-webkit-mask-image': this
        }
    }
}