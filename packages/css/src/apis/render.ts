import MasterCSS from '../css'
import '../polyfills/css-escape'

export default function render(classes: string[], css: MasterCSS = new MasterCSS({ observe: false })): string {
    if (!classes?.length) return
    for (const eachClassName of classes) {
        if (!(eachClassName in css.countOfClass)) {
            if (css.insert(eachClassName))
                css.countOfClass[eachClassName] = 1
        }
    }
    return css.text
}