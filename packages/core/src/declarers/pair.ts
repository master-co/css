import { ValueComponent } from '../types/syntax'

export default function pair(_: string, valueComponents: ValueComponent[], [x, y]: [string, string]) {
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