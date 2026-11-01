import Demo from './Demo'
import DemoViewport from './DemoViewport'

export interface DemoStyleComparisonProps {
  /** Trusted site-authored HTML only. Both previews receive this exact markup. */
  html: string
  css: string
  height?: number
  sizing?: 'viewport' | 'content'
  caption?: string
}

/** Native browser defaults versus supplied CSS, without a flashing transition. */
export default function DemoStyleComparison({ html, css, height = 320, sizing = 'viewport', caption }: DemoStyleComparisonProps) {
  const document = (styles: string) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${styles.replaceAll('</style', '<\\/style')}</style></head><body>${html}</body></html>`
  return <Demo title="Browser defaults and author CSS" description="The same HTML in two documents" frame="none" caption={caption}>
    <div className="ui-compare">
      <figure><figcaption>Browser defaults</figcaption><DemoViewport title="Browser defaults" document={document('')} height={height} sizing={sizing} /></figure>
      <figure><figcaption>CSS applied</figcaption><DemoViewport title="CSS applied" document={document(css)} height={height} sizing={sizing} /></figure>
    </div>
  </Demo>
}
