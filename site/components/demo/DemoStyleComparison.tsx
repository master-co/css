import Demo from './Demo'
import DemoViewport from './DemoViewport'
import { DemoComparison } from './primitives'

export interface DemoStyleComparisonProps {
  /** Trusted site-authored HTML only. Both previews receive this exact markup. */
  html: string
  css: string
  height?: number
}

/** Native browser defaults versus supplied CSS, without a flashing transition. */
export default function DemoStyleComparison({ html, css, height = 320 }: DemoStyleComparisonProps) {
  const document = (styles: string) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${styles.replaceAll('</style', '<\\/style')}</style></head><body>${html}</body></html>`
  return <DemoComparison className="demo-style-comparison">
    <Demo title="Browser defaults" description="HTML without author CSS" background="plain" padding="none">
      <DemoViewport title="Browser defaults" document={document('')} height={height} />
    </Demo>
    <Demo title="CSS applied" description="The same HTML with author CSS" background="plain" padding="none">
      <DemoViewport title="CSS applied" document={document(css)} height={height} />
    </Demo>
  </DemoComparison>
}
