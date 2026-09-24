import DemoThemeComparison from './DemoThemeComparison'

export function FoundationColorRoles() {
  return <DemoThemeComparison name="color-roles" title="One composition, two modes" html={`<article class="p-md r-lg b:1px|solid|var(--color-line-base) surface-raised text-body">
<h2 class="m:0 text-lg font-semibold text-strong">Project updates</h2>
<p class="mt-xs mb-md text-muted">Three milestones changed this week.</p>
<a class="text-link text-link-hover:hover underline" href="/guide/colors#preset-color-roles" target="_top">Explore color roles</a>
</article>`} caption="Both documents use identical classes. The active mode supplies the surface, line and text values." />
}

export function FoundationSurfaces() {
  return <DemoThemeComparison name="surfaces" title="Surface hierarchy" html={`<section class="p-md r-lg surface-muted">
<p class="mb-sm font-mono font-xs text-muted">surface-muted</p>
<article class="p-md r-sm b:1px|solid|var(--color-line-base) surface-raised">
<h2 class="m:0 text-md font-semibold text-strong">Collection settings</h2>
<p class="mt-xs mb:0 text-muted">A raised panel on a subdued section.</p>
</article></section>`} caption="Color separates these surfaces. This example adds no shadow." />
}

export function FoundationLines() {
  return <DemoThemeComparison name="lines" title="Visible boundaries" html={`<div class="grid gap-md">
<section class="p-md r-sm b:1px|solid|var(--color-line-base) surface-raised"><h2 class="m:0 text-md font-medium">Default boundary</h2><p class="mt-xs mb:0 text-muted">b:1px|solid|var(--color-line-base)</p></section>
<section class="p-md r-sm b:1px|solid|var(--color-line-strong) surface-raised"><h2 class="m:0 text-md font-medium">Emphasized boundary</h2><p class="mt-xs mb:0 text-muted">b:1px|solid|var(--color-line-strong)</p></section>
</div>`} caption="The line role selects a color. Width and style still need an explicit declaration." />
}

export function FoundationTextRoles() {
  return <DemoThemeComparison name="text-roles" title="Readable hierarchy" html={`<article class="grid gap-sm p-md r-lg b:1px|solid|var(--color-line-base) surface-raised text-body">
<h2 class="m:0 text-lg font-semibold text-strong">Quarterly report</h2>
<p class="m:0">The current cycle is on track.</p>
<p class="m:0 text-sm text-muted">Updated 12 minutes ago</p>
<button type="button" class="text-disabled cursor:not-allowed" disabled>Archive unavailable</button>
<a class="text-link text-link-hover:hover underline" href="/guide/colors#text-roles" target="_top">Explore text roles</a>
<span class="w:fit-content px-sm py-2xs r-sm surface-inverse text-inverse">Private note</span>
</article>`} caption="The archive action is natively disabled. Inverse text is paired with its inverse surface." />
}

export function FoundationHue() {
  return <DemoThemeComparison name="base-hue" title="A mode-aware hue" html={`<div class="grid gap-md">
<div class="h:4rem r-sm bg-yellow" aria-label="Yellow background swatch" role="img"></div>
<p class="m:0 font-mono font-xs text-muted">bg-yellow</p>
<svg class="size:3rem fg-yellow" viewBox="0 0 48 48" role="img" aria-label="Yellow diamond"><path d="M24 2 46 24 24 46 2 24Z" fill="currentColor"/></svg>
<p class="m:0 font-mono font-xs text-muted">fg-yellow · currentColor</p>
</div>`} caption="Hue aliases adapt their palette step to the mode. They do not choose a matching text color automatically." />
}

export function FoundationTextHue() {
  return <DemoThemeComparison name="text-hue" title="Foreground color by role" html={`<article class="p-md r-sm b:1px|solid|var(--color-line-base) surface-raised">
<p class="m:0 text-sm font-medium text-blue">Editorial notes</p>
<h2 class="mt-xs mb-sm text-xl font-semibold text-strong">A clearer perspective</h2>
<p class="m:0 text-body">Use a colored label alongside a clear heading and readable body copy.</p>
</article>`} caption="text-blue uses the foreground-oriented alias. Check the actual foreground and surface together." />
}

export function FoundationElevation() {
  return <DemoThemeComparison name="elevation" title="Quiet separation" html={`<article class="m-sm p-md r-lg surface-raised shadow-sm">
<h2 class="m:0 text-lg font-semibold text-strong">Collection notes</h2>
<p class="mt-xs mb:0 text-muted">A raised surface with a small, consistent shadow.</p>
</article>`} caption="shadow-sm uses the same offsets across these modes, with different edge and shadow colors." />
}

export function FoundationElevationState() {
  return <DemoThemeComparison name="elevation-state" print title="Depth follows interaction" html={`<a class="block m-sm p-md r-lg surface-raised text-body shadow-sm shadow-md:hover@screen shadow-md:focus-visible@screen shadow:none@print text-decoration:none" href="/guide/elevation#change-elevation-by-state" target="_top">
<strong class="block text-strong">Collection guide ↗</strong>
<span class="block mt-xs text-muted">Hover or focus this link to lift its surface.</span>
</a>`} caption="A native link supports pointer and keyboard focus. The focus outline remains visible; printing removes the shadow." />
}
