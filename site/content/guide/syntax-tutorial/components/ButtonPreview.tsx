import { generatePresetCSS } from '~/site/common/generate-preset-css'
import { getThemeNumericVariableEntries } from '~/site/utils/theme-variables'
import DemoViewport from '~/site/components/demo/DemoViewport'

export default function ButtonPreview({ classes, responsive = false }: { classes: string[]; responsive?: boolean }) {
  const breakpoint = getThemeNumericVariableEntries('breakpoint').find(entry => entry.key === 'sm')
  if (!breakpoint) throw new Error('Syntax Tutorial requires the preset sm breakpoint')
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><style>
    @layer theme, base, defaults, components, utilities;
    @layer base { :root { color-scheme: light dark; } body { margin: 24px; font: 16px system-ui; } button { font: inherit; } }
    ${generatePresetCSS(classes)}
    </style></head><body><button type="button" class="${classes.join(' ')}">Save</button></body></html>`
  return <DemoViewport document={html} title="Responsive button padding" responsive={responsive} height={140}
    widthPresets={responsive ? [{ label: 'Below sm', width: Math.floor(breakpoint.px) - 1 }, { label: 'At sm and above', width: Math.ceil(breakpoint.px) + 1 }] : undefined} />
}
