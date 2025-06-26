import CSSRuntime, { initCSSRuntime } from '../../src'

// initCSSRuntime({
//     components: {
//         btn: 'bg:black'
//     }
// })

// const createElement = (name: string) => {
//     const el = document.createElement('div')
//     el.id = name
//     el.className = name
//     return el
// }
// const p1 = createElement('p1')
// p1.innerHTML = `
//     <div id="p1c2" class="p1c2"></div>
//     <div id="p1c3" class="p1c3"></div>
// `
// const p1c1 = createElement('p1c1')
// const p1c2 = p1.querySelector('#p1c2') as HTMLHeadElement
// const p1c3 = p1.querySelector('#p1c3') as HTMLHeadElement
// document.body.appendChild(p1)
// p1.appendChild(p1c1)
// p1c2.remove()
// p1.appendChild(p1c2)
// p1c2.classList.add('p1c2-1')
// p1c3.remove()
// p1c3.classList.add('p1c3-1')
// p1.remove()

/* iframe test */
const iframe = document.querySelector('iframe')
if (iframe?.contentDocument) {
    new CSSRuntime(iframe.contentDocument)
        .observe()
}