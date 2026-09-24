import DemoThemeComparison from '~/site/components/demo/DemoThemeComparison'

export default function NaturalMaterials() {
  return <>
    <DemoThemeComparison name="natural-architecture" title="Architecture · sand and taupe" height={460}
      html={`<article class="overflow:hidden r:sm bg:sand-0 bg:taupe-95@dark fg:taupe-80 fg:sand-10@dark">
<div class="px:md pt:md pb:sm flex justify-content:space-between font:xs font:mono"><span>ATELIER / 08</span><span>FIELD NOTES</span></div>
<svg viewBox="0 0 320 190" class="block w:full" role="img" aria-label="Warm plaster walls, an arched doorway and a sunlit courtyard">
<rect width="320" height="190" class="fill:sand-10 fill:sand-80@dark"/>
<rect x="36" y="24" width="190" height="166" class="fill:sand-30 fill:sand-60@dark"/>
<path d="M85 190V102a46 46 0 0 1 92 0v88Z" class="fill:taupe-70 fill:taupe-100@dark"/>
<path d="M97 190V103a34 34 0 0 1 68 0v87Z" class="fill:sand-5 fill:sand-40@dark"/>
<path d="M165 108v82h61Z" class="fill:sand-50 fill:sand-70@dark"/>
<rect x="246" y="74" width="38" height="116" class="fill:taupe-40 fill:taupe-70@dark"/>
<path d="M0 172H320V190H0Z" class="fill:sand-40 fill:sand-90@dark"/>
</svg>
<div class="p:md">
<p class="m:0 font:xs font:mono">MATERIAL STUDY / NO. 03</p>
<h3 class="mt:sm mb:sm font:serif font:3xl font:regular leading:sm">Spaces shaped<br>by light.</h3>
<p class="m:0 leading:lg">Limewashed walls, open courtyards and the quiet warmth of unpolished stone.</p>
<a href="/guide/colors#natural-material-colors" target="_top" class="inline-block mt:md fg:taupe-80 fg:sand-10@dark underline">Explore the materials</a>
</div></article>`}
      caption="Sand carries the golden surfaces; taupe supplies a quieter red-brown counterpoint. Fixed steps are paired explicitly for each mode." />
    <DemoThemeComparison name="natural-living" title="Natural living · olive, sage and moss" height={480}
      html={`<article class="overflow:hidden r:sm bg:sage-0 bg:sage-95@dark fg:moss-80 fg:sage-10@dark">
<div class="p:md flex justify-content:space-between font:xs font:mono"><span>THE GARDEN JOURNAL</span><span>VOL. 04</span></div>
<svg viewBox="0 0 320 190" class="block w:full" role="img" aria-label="Olive and moss leaves growing in a pale sage garden">
<rect width="320" height="190" class="fill:sage-10 fill:sage-80@dark"/>
<circle cx="227" cy="64" r="40" class="fill:olive-20 fill:olive-60@dark"/>
<path d="M154 190V57M154 129L108 91M154 155L211 101" fill="none" stroke-width="4" class="stroke:moss-60 stroke:moss-30@dark"/>
<path d="M154 97C112 83 116 39 155 27C188 49 184 82 154 97Z" class="fill:moss-50 fill:moss-40@dark"/>
<path d="M113 112C76 115 64 83 67 55C104 51 128 77 113 112Z" class="fill:olive-50 fill:olive-40@dark"/>
<path d="M186 138C174 100 205 77 242 86C239 122 218 143 186 138Z" class="fill:sage-50 fill:sage-30@dark"/>
<path d="M137 153H177L171 190H143Z" class="fill:olive-70 fill:olive-90@dark"/>
</svg>
<div class="p:md">
<p class="m:0 font:xs font:mono">SEASONAL NOTES</p>
<h3 class="mt:sm mb:sm font:serif font:3xl font:regular leading:sm">A slower kind<br>of growing.</h3>
<p class="m:0 leading:lg">A little shade, patient tending, and room for something green.</p>
<div class="mt:md p:sm r:sm bg:sage-5 bg:sage-90@dark flex justify-content:space-between gap:sm"><span>Late summer</span><span>Shade garden</span></div>
</div></article>`}
      caption="Olive stays yellow-green, sage softens the surfaces, and moss adds a fuller leaf green. The three families keep separate identities." />
    <DemoThemeComparison name="natural-boutique" title="Objects · petrol, copper and terracotta" height={490}
      html={`<article class="overflow:hidden r:sm surface:raised text:body">
<div class="p:md flex justify-content:space-between gap:sm font:xs font:mono"><span class="text:petrol">FORM & FIRING</span><span class="text:copper">SMALL EDITIONS</span></div>
<svg viewBox="0 0 320 190" class="block w:full" role="img" aria-label="A terracotta ceramic vessel against a petrol backdrop with a copper shelf">
<rect width="320" height="190" class="fill:petrol-80 fill:petrol-95@dark"/>
<circle cx="240" cy="45" r="75" class="fill:petrol-70 fill:petrol-90@dark"/>
<rect y="159" width="320" height="31" class="fill:copper-40 fill:copper-70@dark"/>
<path d="M113 54H194L188 87Q219 103 211 146Q204 164 154 164Q110 164 103 146Q96 107 119 87Z" class="fill:terracotta-40 fill:terracotta-50@dark"/>
<path d="M166 86Q200 118 179 163Q204 164 211 146Q219 103 188 87L194 54H177Z" class="fill:terracotta-60 fill:terracotta-70@dark"/>
<ellipse cx="154" cy="54" rx="40" ry="8" class="fill:terracotta-20 fill:terracotta-30@dark"/>
<ellipse cx="154" cy="54" rx="27" ry="4" class="fill:terracotta-80 fill:terracotta-90@dark"/>
</svg>
<div class="p:md">
<p class="m:0 font:xs font:mono text:terracotta">HAND-FINISHED STONEWARE</p>
<h3 class="mt:sm mb:sm font:serif font:3xl font:regular leading:sm text:strong">The everyday<br>ritual vessel.</h3>
<p class="m:0 leading:lg">Soft edges, warm clay and a glaze that catches the morning light.</p>
<div class="mt:md flex justify-content:space-between items-center gap:sm"><span class="text:petrol">Edition of 24</span><a href="/guide/colors#natural-material-colors" target="_top" class="text:petrol underline">View the palette</a></div>
</div></article>`}
      caption="Petrol sets a cool mineral backdrop. Copper brings golden warmth and terracotta a softer red clay. Text uses the new mode-aware foreground aliases." />
  </>
}
