import Demo from './Demo'
import DemoViewport from './DemoViewport'
import { DemoComparison, DemoLabel } from './primitives'
import { demoDocument } from './reference/document'

export interface DemoThemeComparisonProps {
  name: string
  title: string
  /** Trusted site-authored HTML with complete, scannable Master CSS classes. */
  html: string
  css?: string
  caption?: string
  height?: number
  print?: boolean
}

/** Independent documents keep mode variables and native state inside each specimen. */
export default function DemoThemeComparison({ name, title, html, css = '', caption, height = 240, print = false }: DemoThemeComparisonProps) {
  const document = demoDocument({ page: 'foundations', id: name, title, html: [html], css, classes: [], classLists: [], highlighted: [] }, { html, bodyClass: 'p-md bg-surface-base text-body', caption: '' })
  return <Demo title={title} background="plain" padding="md" caption={caption} data-foundation-paint={name}>
    <DemoComparison>
      {(['light', 'dark'] as const).map(mode => <div key={mode} data-theme-specimen={mode}>
        <DemoLabel className="mb-xs">{mode === 'light' ? 'Light' : 'Dark'}</DemoLabel>
        <div className="demo-theme-preview"><DemoViewport title={`${title} · ${mode}`} document={document} initialTheme={mode} print={print} height={height} sizing="content" /></div>
      </div>)}
    </DemoComparison>
  </Demo>
}
