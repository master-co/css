import DemoThemeComparison from './DemoThemeComparison'

export function FoundationColorRoles() {
  return <DemoThemeComparison name="color-roles" title="One composition, two modes" html={"<article id=\"color-role\" class=\"p-md r-lg border-width:1px border-style:solid b-line-divider bg-surface-raised fg-text-body\">\n<h2 class=\"margin:0 text-lg font-weight-semibold fg-text-strong\">Project updates</h2>\n<p class=\"mt-xs mb-md fg-text-muted\">Three milestones changed this week.</p>\n<a class=\"fg-text-link fg-text-link-hover:hover text-decoration:underline\" href=\"/guide/colors#preset-color-roles\" target=\"_top\">Explore color roles</a>\n<p class=\"mt-sm margin-bottom:0 font-size-xs overflow-wrap:anywhere\" data-style-readout=\"color-role\" data-style-property=\"color\"></p>\n</article>"} caption="Both documents use identical classes. The active mode supplies the surface, line and text values." />
}

export function FoundationSurfaces() {
  return <DemoThemeComparison name="surfaces" title="Surface hierarchy" html={"<section class=\"p-md r-lg bg-surface-inset\">\n<p class=\"mb-sm font-family-mono font-size-xs fg-text-muted\">bg-surface-inset</p>\n<article class=\"p-md r-sm border-width:1px border-style:solid b-line-divider bg-surface-raised\">\n<h2 class=\"margin:0 text-md font-weight-semibold fg-text-strong\">Collection settings</h2>\n<p class=\"mt-xs margin-bottom:0 fg-text-muted\">A raised panel on a subdued section.</p>\n</article></section>"} caption="Color separates these surfaces. This example adds no shadow." />
}

export function FoundationLines() {
  return <DemoThemeComparison name="lines" title="Visible boundaries" html={"<div class=\"display:grid gap-md\">\n<section class=\"p-md r-sm border-width:1px border-style:solid b-line-divider bg-surface-raised\"><h2 class=\"margin:0 text-md font-weight-medium\">Decorative divider</h2><p class=\"mt-xs margin-bottom:0 fg-text-muted\">b-line-divider</p></section>\n<section class=\"p-md r-sm border-width:1px border-style:solid b-line-control bg-surface-raised\"><h2 class=\"margin:0 text-md font-weight-medium\">Control boundary</h2><p class=\"mt-xs margin-bottom:0 fg-text-muted\">b-line-control</p></section>\n</div>"} caption="The line role selects a color. Width and style still need an explicit declaration." />
}

export function FoundationTextRoles() {
  return <DemoThemeComparison name="text-roles" title="Readable hierarchy" html={"<article class=\"display:grid gap-sm p-md r-lg border-width:1px border-style:solid b-line-divider bg-surface-raised fg-text-body\">\n<h2 class=\"margin:0 text-lg font-weight-semibold fg-text-strong\">Quarterly report</h2>\n<p class=\"margin:0\">The current cycle is on track.</p>\n<p class=\"margin:0 text-sm fg-text-muted\">Updated 12 minutes ago</p>\n<button type=\"button\" class=\"fg-text-disabled cursor:not-allowed\" disabled>Archive unavailable</button>\n<a class=\"fg-text-link fg-text-link-hover:hover text-decoration:underline\" href=\"/guide/colors#text-roles\" target=\"_top\">Explore text roles</a>\n<span class=\"width:fit-content px-sm py-2xs r-sm bg-surface-inverse fg-text-inverse\">Private note</span>\n</article>"} caption="The archive action is natively disabled. Inverse text is paired with its inverse surface." />
}

export function FoundationHue() {
  return <DemoThemeComparison name="base-hue" title="A fixed hue" html={"<div class=\"display:grid gap-md\">\n<div class=\"height:4rem r-sm bg-yellow\" aria-label=\"Yellow background swatch\" role=\"img\"></div>\n<p class=\"margin:0 font-family-mono font-size-xs fg-text-muted\">bg-yellow</p>\n<svg class=\"width:3rem height:3rem fg-yellow\" viewBox=\"0 0 48 48\" role=\"img\" aria-label=\"Yellow diamond\"><path d=\"M24 2 46 24 24 46 2 24Z\" fill=\"currentColor\"/></svg>\n<p class=\"margin:0 font-family-mono font-size-xs fg-text-muted\">fg-yellow · currentColor</p>\n</div>"} caption="General hue aliases keep the same swatch in both schemes. Use text hue aliases for adaptive readable foregrounds." />
}

export function FoundationTextHue() {
  return <DemoThemeComparison name="text-hue" title="Foreground color by role" html={"<article class=\"p-md r-sm border-width:1px border-style:solid b-line-divider bg-surface-raised\">\n<p class=\"margin:0 text-sm font-weight-medium fg-text-blue\">Editorial notes</p>\n<h2 class=\"mt-xs mb-sm text-xl font-weight-semibold fg-text-strong\">A clearer perspective</h2>\n<p class=\"margin:0 fg-text-body\">Use a colored label alongside a clear heading and readable body copy.</p>\n</article>"} caption="fg-text-blue uses the foreground-oriented alias. Check the actual foreground and surface together." />
}

export function FoundationElevation() {
  return <DemoThemeComparison name="elevation" title="Quiet separation" html={"<article id=\"shadow-role\" class=\"m-sm p-md r-lg bg-surface-raised shadow-sm\">\n<h2 class=\"margin:0 text-lg font-weight-semibold fg-text-strong\">Collection notes</h2>\n<p class=\"mt-xs margin-bottom:0 fg-text-muted\">A raised surface with a small, consistent shadow.</p>\n<p class=\"mt-sm margin-bottom:0 font-size-xs overflow-wrap:anywhere\" data-style-readout=\"shadow-role\" data-style-property=\"box-shadow\"></p>\n</article>"} caption="shadow-sm uses the same offsets across these modes, with different edge and shadow colors." />
}

export function FoundationElevationState() {
  return <DemoThemeComparison name="elevation-state" print title="Depth follows interaction" html={"<a class=\"display:block m-sm p-md r-lg bg-surface-raised fg-text-body shadow-sm shadow-md:hover@media(screen) shadow-md:focus-visible@media(screen) box-shadow:none@media(print) text-decoration:none\" href=\"/guide/elevation#change-elevation-by-state\" target=\"_top\">\n<strong class=\"display:block fg-text-strong\">Collection guide ↗</strong>\n<span class=\"display:block mt-xs fg-text-muted\">Hover or focus this link to lift its surface.</span>\n</a>"} caption="A native link supports pointer and keyboard focus. The focus outline remains visible; printing removes the shadow." />
}
