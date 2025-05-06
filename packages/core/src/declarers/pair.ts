import { ValueComponent } from '../types/syntax'

export default function pair(_: string, valueComponents: ValueComponent[], data: [string, string]) {
    const [x, y] = data
    const length = valueComponents.length
    return {
        [x]: length === 1
            ? valueComponents[0].text
            : valueComponents[0].text,
        [y]: length === 1
            ? valueComponents[0].text
            : valueComponents[2].text
    }
}