import { Rule } from '../'

export class MaskImage extends Rule {
    static override id = 'MaskImage' as const
    override get(declaration): { [key: string]: any } {
        return {
            'mask-image': declaration,
            '-webkit-mask-image': declaration
        }
    }
}