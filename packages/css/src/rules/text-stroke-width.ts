import { RuleConfig } from '..'

export const textStrokeWidth: RuleConfig = {
    matches: '^text-stroke(:(thin|medium|thick|\\.?[0-9]+|$values)(?!\\|)|-width:.)',
    prop: false,
    get(declaration): { [key: string]: any } {
        return {
            '-webkit-text-stroke-width': declaration
        }
    }
}