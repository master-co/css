import { auditNaturalColors, colorLevels, mapToSRGB, resolveColor } from './natural-colors-audit'

const audit = auditNaturalColors()
const escape = (value: unknown) => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;')
const neighbors = ['stone', 'gray', 'brown', 'orange', 'lime', 'green', 'teal', 'slate']
function row(family: string) {
  return `<section class="scale" aria-label="${family} palette"><h2>${family}</h2>${colorLevels.map(level => {
    const color = resolveColor(`color-${family}-${level}`)
    const authored = color.toString({ precision: 6 })
    const srgb = mapToSRGB(color).to('srgb').toString({ format: 'hex' })
    return `<div><div class="swatch" data-authored="${escape(authored)}" data-srgb="${srgb}" style="background:${authored}" title="${family}-${level}: ${escape(authored)} / ${srgb}"></div><span>${level}</span></div>`
  }).join('')}</section>`
}

process.stdout.write(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Master CSS · Natural material palette review</title><style>
*{box-sizing:border-box}body{margin:0;background:#faf9f6;color:#292521;font:14px/1.6 system-ui,sans-serif}body.dark{background:#181a19;color:#eeeae2}main{max-width:1160px;margin:auto;padding:40px 28px}h1{font-size:32px;letter-spacing:-1px;margin:0}p{margin:8px 0 20px}.controls{display:flex;gap:24px;flex-wrap:wrap;margin:24px 0}label{display:flex;align-items:center;gap:8px}input{width:18px;height:18px}.scale{display:grid;grid-template-columns:100px repeat(13,minmax(0,1fr));gap:8px;align-items:center;margin:20px 0}.scale h2{font-size:14px;font-weight:600}.swatch{height:62px;border-radius:5px;box-shadow:inset 0 0 0 1px #80808022}.scale span{display:block;text-align:center;font-size:11px;margin-top:6px;font-variant-numeric:tabular-nums}summary{cursor:pointer;font-weight:600;margin-top:32px}table{border-collapse:collapse;width:100%;margin-top:20px}td,th{padding:10px;text-align:left;border-bottom:1px solid #80808044;font-variant-numeric:tabular-nums}code{font-size:12px}small{display:block;margin-top:28px}h2{font-size:19px}caption{text-align:left;font-weight:600;font-size:19px;margin-top:32px} .table-scroll{overflow-x:auto}@media(max-width:720px){main{padding:24px 16px}.scale{grid-template-columns:repeat(7,minmax(0,1fr));gap:6px}.scale h2{grid-column:1/-1;margin:0}.swatch{height:48px}h1{font-size:26px}}
</style><main><h1>Natural materials</h1><p>Eight individually tuned families · 104 fixed shades · OKLCH · Master CSS</p>
<div class="controls"><label><input type="checkbox" id="dark">Dark canvas</label><label><input type="checkbox" id="srgb">Show mapped sRGB</label></div>
<div id="new-palettes">${audit.map(({ family }) => row(family)).join('')}</div>
<details id="comparisons"><summary>Compare neighboring existing families</summary>${neighbors.map(row).join('')}</details>
<div class="table-scroll"><table><caption>Mode-aware text on preset surfaces</caption><thead><tr><th>Family</th><th>Light text</th><th>Minimum contrast</th><th>Dark text</th><th>Minimum contrast</th></tr></thead><tbody>${audit.map(({ family, modes }) => `<tr><th>${family}</th>${modes.map(mode => `<td><code>${escape(mode.text)}</code></td><td>${Math.min(...Object.values(mode.contrast)).toFixed(2)}:1</td>`).join('')}</tr>`).join('')}</tbody></table></div>
<h2>Reading this review</h2><p>The original and mapped palettes must both keep a descending lightness order. The 0–5 and 90–95 intervals are half the numbered distance of a ten-step interval. Color differences are reviewed per numbered unit, alongside the visible swatches.</p>
<p>All new colors fit Display P3. Petrol 60 and 70 extend slightly beyond sRGB. The sRGB toggle uses Color.js CSS gamut mapping; it is a numerical preview, not proof that a monitor is displaying P3. Hover a swatch for its value.</p>
<small>Contrast minima cover base, muted, raised and overlay in each mode, after sRGB mapping. Existing palette values are unchanged. Native CSS olive can still be expressed as #808000.</small></main>
<script>document.querySelector('#dark').onchange=e=>document.body.classList.toggle('dark',e.target.checked);document.querySelector('#srgb').onchange=e=>document.querySelectorAll('.swatch').forEach(s=>s.style.background=e.target.checked?s.dataset.srgb:s.dataset.authored);</script></html>`)
