import { transitionStudies, type TransitionStudyName } from '../../../../content/guide/view-transitions/illustration'
import { drawing, type Theme } from '@master/internal-site/demo/illustration-materials.ts'

const photoURL = new URL('@master/internal-site/examples/images/article-aurora.jpg', import.meta.url).href
const cssURL = new URL('./illustration.css', import.meta.url).href
const at = (x: number, y: number, width: number, height: number) => `left:${x}px;top:${y}px;width:${width}px;height:${height}px`
const photo = (x: number, y: number, width: number, height: number, old = false) => `<img class="vt-photo" alt="" src="${photoURL}" style="${at(x, y, width, height)}"${old ? ' data-old' : ''}>`
const copy = (x: number, y: number, width: number) => `<i class="vt-copy" style="${at(x, y, width, 4)}"></i>`
const view = (x: number, y: number, width: number, height: number, detail: boolean) => `<div class="vt-view" style="${at(x, y, width, height)}"><div class="vt-bar"></div>${photo(12, 38, detail ? width - 24 : 58, detail ? 76 : 45)}${detail ? copy(12, 130, width - 40) + copy(12, 145, width - 55) : copy(83, 42, width - 98) + copy(83, 58, width - 105) + copy(12, 105, width - 24) + copy(12, 122, width - 42)}</div>`

export function renderStudy(name: TransitionStudyName, theme: Theme) {
  const figure = transitionStudies[name]
  const { text, label, route, scene, sheet, row, rule, divider } = drawing(theme)
  const l = figure.labels as readonly string[]
  const node = (x: number, y: number, value: string, withPhoto = false, invalid = false) => `<div class="vt-node" style="left:${x}px;top:${y}px"${invalid ? ' data-invalid' : ''}>${withPhoto ? `<img src="${photoURL}" alt="">` : ''}${label(value, 'code')}</div>`
  let body = ''
  if (name === 'capture-lifecycle') {
    // The same photo survives all three stages. The lower strip is the actual updated DOM,
    // while the upper-right region is the separate visual overlay.
    body = `${text(48, 44, l[0], 'title')}${text(275, 44, l[1], 'title')}${text(500, 44, l[2], 'title')}
      ${view(48, 84, 168, 176, false)}${text(62, 86, l[3], 'edge')}
      ${view(275, 84, 168, 176, true)}${text(289, 86, l[4], 'edge')}
      ${route('M228 169H263')}${route('M455 169H488')}
      <div class="vt-layer" style="${at(500, 84, 172, 176)}"></div>
      ${photo(515, 112, 60, 43, true)}${photo(536, 164, 119, 70)}
      ${text(588, 112, l[5], 'edge')}${text(536, 244, l[6], 'edge')}
      ${route('M518 165V208H527')}
      ${text(48, 295, l[7], 'eyebrow')}${text(275, 295, l[8], 'note')}
      ${route('M48 327H672', { arrow: false })}
      ${text(48, 345, l[9], 'code')}${text(275, 375, l[10], 'code')}
      ${text(500, 345, l[11], 'code')}${text(672, 345, l[12], 'code', 'end')}
      ${route('M500 379H672')}${text(586, 398, l[13], 'note', 'center')}
      <i class="vt-tick" style="left:275px;top:321px"></i><i class="vt-tick" style="left:500px;top:321px"></i>`
  } else if (name === 'capture-identity') {
    body = `${text(63, 42, l[0], 'title')}${text(418, 42, l[1], 'title')}
      <div class="vt-layer" style="${at(43, 80, 634, 206)}"></div>
      ${node(63, 100, l[4], true)}${node(418, 100, l[4], true)}
      ${node(63, 184, l[5])}${node(418, 184, l[5])}
      ${route('M333 128H406')}${route('M287 206H406')}
      ${text(360, 252, l[6], 'code', 'center')}
      ${text(360, 299, l[7], 'note', 'center')}
      ${text(63, 351, l[8], 'title')}${node(300, 340, l[9], false, true)}${node(400, 340, l[10], false, true)}
      ${route('M484 363H551')}${text(571, 353, l[11], 'title')}
      ${text(360, 416, l[12], 'note', 'center')}`
  } else if (name === 'capture-tree') {
    const branch = (x: number, y: number, height: number) => `<i class="vt-tree-line" style="left:${x}px;top:${y}px;height:${height}px"></i>`
    body = `${text(42, 44, l[0], 'eyebrow')}${text(42, 83, l[1], 'code')}
      ${branch(52, 108, 37)}${text(78, 135, l[2], 'code')}
      ${branch(52, 145, 48)}${text(78, 183, l[3], 'code')}
      ${branch(88, 208, 38)}${text(114, 236, l[4], 'code')}
      ${branch(124, 262, 36)}${text(150, 288, l[5], 'code')}
      ${branch(124, 298, 44)}${text(150, 332, l[6], 'code')}
      ${text(564, 133, l[7], 'note', 'center')}
      <div class="vt-geometry" style="${at(460, 174, 210, 186)}"></div>
      ${photo(475, 190, 108, 70, true)}${photo(522, 253, 132, 90)}
      ${text(595, 200, l[8], 'edge')}${text(477, 310, l[9], 'edge')}
      ${route('M379 194H449')}
      ${text(564, 381, l[10], 'note', 'center')}${text(564, 407, l[13], 'edge', 'center')}
      ${text(42, 407, l[12], 'note')}`
  } else {
    body = `${text(48, 35, l[0], 'eyebrow')}${text(48, 259, l[1], 'eyebrow')}
      <div class="vt-scope" style="${at(48, 70, 624, 166)}"></div>
      ${text(66, 78, l[4], 'edge')}
      ${view(70, 99, 132, 124, false)}${view(518, 99, 132, 124, true)}
      ${text(218, 108, l[5], 'title')}${text(218, 145, l[6], 'code')}
      ${route('M214 190H506')}
      ${divider(48, 240, 242)}
      ${sheet(48, 300, undefined, undefined, row(label(l[7])) + rule + row(label(l[11], 'code')) + row(label(l[12], 'code')))}
      ${sheet(483, 300, undefined, undefined, row(label(l[8])) + rule + row(label(l[11], 'code')) + row(label(l[12], 'code')))}
      ${text(360, 306, l[9], 'title', 'center')}${route('M249 349H471')}
      ${text(360, 370, l[10], 'note', 'center')}${text(360, 436, l[13], 'note', 'center')}`
  }
  return scene(figure.title, figure.alt, `<link rel="stylesheet" href="${cssURL}">${body}`)
}
