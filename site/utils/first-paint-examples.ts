import { configuredExampleCSS, configuredMarkupClasses } from '../reference/configured-example'
import type { DemoWaterfallProps } from '../components/demo/DemoWaterfall'

export const resourceWaterfalls = [
  {
    title: 'Discovered by the runtime',
    description: 'HTML exposes the stylesheet and script. The default program waits until the runtime entry executes.',
    rows: [
      { label: 'HTML', start: 0, end: 30, tone: 'neutral' },
      { label: 'Base CSS', start: 10, end: 48, tone: 'neutral' },
      { label: 'Runtime script', start: 10, end: 52, tone: 'violet' },
      { label: 'Default program', start: 60, end: 88, tone: 'blue' }
    ],
    marker: { label: 'FCP', position: 88 },
    caption: 'Illustrative order · no time scale. FCP can follow the critical stylesheet, script and program.'
  },
  {
    title: 'Program exposed in HTML',
    description: 'A fetch preload starts the program request while the document is parsed.',
    rows: [
      { label: 'HTML', start: 0, end: 30, tone: 'neutral' },
      { label: 'Base CSS', start: 10, end: 48, tone: 'neutral' },
      { label: 'Runtime script', start: 10, end: 52, tone: 'violet' },
      { label: 'Default program', start: 10, end: 38, tone: 'blue' }
    ],
    marker: { label: 'FCP', position: 52 },
    caption: 'Illustrative order · no time scale. Starting the critical requests earlier can move first paint earlier.'
  }
] as const satisfies readonly DemoWaterfallProps[]

export function resourceWaterfallsMarkdown() {
  return resourceWaterfalls.map(item => `**${item.title}.** ${item.description}\n\nResources shown: ${item.rows.map(row => row.label).join(', ')}. Marker: ${item.marker.label}. ${item.caption}`).join('\n\n')
}

export const firstPaintHTML = "<article class=\"m-md p-lg r-lg border-width:1px border-style:solid b-line-divider font-sans\">\n  <p class=\"margin:0 font-xs fg-text-muted\">PROJECT NOTES</p>\n  <h2 class=\"my-sm font-2xl font-semibold leading-sm fg-text-strong\">A clearer first view</h2>\n  <p class=\"margin:0 leading-lg fg-text-muted\">The same content, with typography and spacing ready to read.</p>\n</article>"

export function firstPaintCSS() {
  return configuredExampleCSS("", configuredMarkupClasses(firstPaintHTML))
}

export function firstPaintMarkdown() {
  return `Browser defaults and CSS applied use the same HTML:\n\n\`\`\`html\n${firstPaintHTML}\n\`\`\`\n\nGenerated CSS for the styled preview:\n\n\`\`\`css disclosure=generated-css\n${firstPaintCSS()}\n\`\`\``
}
