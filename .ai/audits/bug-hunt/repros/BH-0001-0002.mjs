import { renderCompiledManifestCSS } from '../../../../packages/compiler/src/stylesheet/render.ts'
import { compileRenderedStylesheet } from '../../../../packages/compiler/src/stylesheet/index.ts'
const manifest = { version: 1, variables: { color: [{ key: 'brand', value: 'red' }] }, animations: { fade: { to: { opacity: '1' } } }, utilities: [] }
const cases = [
  ['animation-control', '.x{animation:fade 1s}'],
  ['BH-0001-comment-keyframes', '/* @keyframes fade {to{opacity:0}} */ .x{animation:fade 1s}'],
  ['BH-0001-string-keyframes', '.x{content:"@keyframes fade";animation:fade 1s}'],
  ['BH-0001-comment-animation', '/* animation:fade 1s; */'],
  ['BH-0001-string-animation', '.x{content:"animation:fade 1s;"}'],
  ['var-control', '.x{color:var( --color-brand)}'],
  ...['\t', '\n', '\r\n', '\f', '/**/'].map(ws => [`BH-0002-${JSON.stringify(ws)}`, `.x{color:var(${ws}--color-brand)}`])
]
for (const [id, nativeCSS] of cases) {
  const direct = renderCompiledManifestCSS({ manifest, nativeCSS })
  const publicResult = await compileRenderedStylesheet('/audit.css', nativeCSS, { baseManifest: manifest })
  console.log(JSON.stringify({ id, nativeCSS, direct: direct.generatedCSS, public: publicResult.generatedCSS, publicNative: publicResult.nativeCSS }))
}
