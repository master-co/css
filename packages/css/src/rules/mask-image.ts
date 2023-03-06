import { RuleConfig } from '..'

export const maskImage: RuleConfig = {
    get(declaration): { [key: string]: any } {
        return {
            'mask-image': declaration,
            '-webkit-mask-image': declaration
        }
    }
}