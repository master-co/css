import { configuredExampleCSS, configuredMarkupClasses } from '../reference/configured-example'
import type { DemoWaterfallProps } from '../components/demo/DemoWaterfall'

export const resourceWaterfalls = [
  {
    title: 'Discovered by the runtime',
    description: 'HTML exposes the stylesheet and script. The manifest waits until the runtime entry executes.',
    rows: [
      { label: 'HTML', start: 0, end: 30, tone: 'neutral' },
      { label: 'Base CSS', start: 10, end: 48, tone: 'neutral' },
      { label: 'Runtime script', start: 10, end: 52, tone: 'violet' },
      { label: 'Manifest JSON', start: 60, end: 88, tone: 'blue' }
    ]
  },
  {
    title: 'Manifest exposed in HTML',
    description: 'A JSON module hint makes the manifest discoverable while the document is parsed.',
    rows: [
      { label: 'HTML', start: 0, end: 30, tone: 'neutral' },
      { label: 'Base CSS', start: 10, end: 48, tone: 'neutral' },
      { label: 'Runtime script', start: 10, end: 52, tone: 'violet' },
      { label: 'Manifest JSON', start: 10, end: 38, tone: 'blue' }
    ]
  }
] as const satisfies readonly DemoWaterfallProps[]

export function resourceWaterfallsMarkdown() {
  return resourceWaterfalls.map(item => `**${item.title}.** ${item.description}\n\nResources shown: ${item.rows.map(row => row.label).join(', ')}. Illustrative order; no time scale.`).join('\n\n')
}

export const firstPaintHTML = "<article class=\"m-md p-lg r-lg border-width:1px border-style:solid b-line-divider font-family-sans\">\n  <p class=\"margin:0 font-size-xs fg-text-muted\">PROJECT NOTES</p>\n  <h2 class=\"my-sm font-size-2xl font-weight-semibold leading-sm fg-text-strong\">A clearer first view</h2>\n  <p class=\"margin:0 leading-lg fg-text-muted\">The same content, with typography and spacing ready to read.</p>\n</article>"

export function firstPaintCSS() {
  return configuredExampleCSS("", configuredMarkupClasses(firstPaintHTML))
}

export function firstPaintMarkdown() {
  return `Browser defaults and CSS applied use the same HTML:\n\n\`\`\`html\n${firstPaintHTML}\n\`\`\`\n\nGenerated CSS for the styled preview:\n\n\`\`\`css\n${firstPaintCSS()}\n\`\`\``
}
