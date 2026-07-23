import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import { MasterCSSRuntime } from '../../src'
import type { MasterCSSManifest } from '@master/css-schema/manifest'

const defaultManifest = defaultManifestJSON as unknown as MasterCSSManifest

// const cssRuntime = await MasterCSSRuntime.start({
//     manifest: {
//         version: 1,
//         utilities: [
//         {
//             name: 'btn',
//             type: -4,
//             layer: 'components',
//             rules: [
//                 { selector: '&', declarations: { 'background-color': 'black' } }
//             ]
//         }
//         ]
//     }
// })
// cssRuntime.observe()

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
  const cssRuntime = await MasterCSSRuntime.start({
    root: iframe.contentDocument,
    manifest: defaultManifest
  })
  cssRuntime.observe()
}
