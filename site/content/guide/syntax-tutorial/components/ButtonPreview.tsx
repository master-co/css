import { generatePresetCSS } from '~/site/common/generate-preset-css'
import { getThemeNumericVariableEntries } from '~/site/utils/theme-variables'
import PreviewViewport from './PreviewViewport'

export default function ButtonPreview({ classes, responsive = false }: { classes: string[]; responsive?: boolean }) {
  const breakpoint = getThemeNumericVariableEntries('breakpoint').find(entry => entry.key === 'sm')
  if (!breakpoint) throw new Error('Syntax Tutorial requires the preset sm breakpoint')
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><style>
    @layer theme, base, defaults, components, utilities;
    @layer base { :root { color-scheme: light dark; } body { margin: 24px; font: 16px system-ui; } button { font: inherit; } }
    ${generatePresetCSS(classes)}
    </style></head><body><button type="button" class="${classes.join(' ')}">Save</button></body></html>`
  return <PreviewViewport html={html} breakpoint={breakpoint.px} responsive={responsive} />
}
