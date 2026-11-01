import '~/site/styles/system/specimens.css'
import '~/site/styles/brand.css'
import type { CSSProperties } from 'react'
import { IconDownload } from '@tabler/icons-react'
import { brandArtwork, brandAssets, brandGold, brandKit, brandMinimums, brandTypefaces } from '~/site/common/brand'
import { Demo, DemoLabel } from '~/site/components/demo'
import DemoAsset from '~/site/components/demo/DemoAsset'

const artwork = {
  mark: ['/brand/v2/logo/mark/master-mark-on-light.svg', '/brand/v2/logo/mark/master-mark-on-dark.svg', brandArtwork.mark],
  'small-mark': ['/brand/v2/logo/mark/master-mark-small-on-light.svg', '/brand/v2/logo/mark/master-mark-small-on-dark.svg', brandArtwork.mark],
  logotype: ['/images/css-logotype@light.svg', '/images/css-logotype@dark.svg', brandArtwork.logotype],
} as const

/** The approved background variants follow the theme, including without JavaScript. A demo container keeps prose media rules off the artwork. */
function Artwork({ kind, alt }: { kind: keyof typeof artwork, alt: string }) {
  const [light, dark, { width, height }] = artwork[kind]
  return <>
    <img className="hidden@apply(--site-dark)" src={light} width={width} height={height} alt={alt} />
    <img className="hidden@apply(--site-light)" src={dark} width={width} height={height} alt={alt} />
  </>
}

export function BrandMarkFigure() {
  return <Demo caption="The mark keeps half its height clear on every side.">
    <div className="brand-clearspace" data-artwork="mark" data-demo-container=""><Artwork kind="mark" alt="The Master CSS gold mark" /><span aria-hidden="true">½H</span></div>
  </Demo>
}

export function BrandSignature() {
  return <Demo title="Horizontal logotype" caption="x is the wordmark's x-height; the mark is 1.3x high. Keep one x clear around the complete signature.">
    <div className="brand-clearspace" data-artwork="logotype" data-demo-container=""><Artwork kind="logotype" alt="The Master CSS horizontal logotype" /><span aria-hidden="true">x</span></div>
  </Demo>
}

export function BrandMinimums() {
  return <Demo title="Minimum sizes" description="At actual CSS pixels" padding="sm" caption="Check the artwork at the size it will be used.">
    <div className="brand-minimums" data-demo-container="">
      {brandMinimums.map(({ kind, title, height }) => <figure key={kind} style={{ '--brand-height': `${height}px` } as CSSProperties}>
        <Artwork kind={kind} alt={`The Master CSS ${title.toLowerCase()} at ${height}px high`} /><DemoLabel>{title} · {height}px</DemoLabel>
      </figure>)}
    </div>
  </Demo>
}

export function BrandGold() {
  return <Demo padding="sm" caption="The mark's gradient belongs to the artwork. Interface gold comes from the preset amber family.">
    <div className="brand-gold">{brandGold().map(color => <figure className="ui-swatch" key={color.value}>
      <div className="ui-swatch-paint" data-signal={color.paint ? undefined : ''} style={color.paint ? { background: color.paint } : undefined} aria-hidden="true" />
      <figcaption><b>{color.title}</b><code>{color.value}</code></figcaption>
    </figure>)}</div>
  </Demo>
}

export function BrandTypefaces() {
  return <Demo align="start">
    <div className="brand-typefaces">{brandTypefaces.map(face => <div key={face.family}>
      <span className={'mono' in face ? 'brand-mono' : undefined} lang={'lang' in face ? face.lang : undefined} aria-hidden="true">{face.sample}</span>
      <b>{face.family}</b><small>{face.role}</small>
    </div>)}</div>
  </Demo>
}

export function BrandDownloads({ kind }: { kind: 'logotype' | 'mark' }) {
  const assets = kind === 'logotype' ? brandAssets.slice(0, 2) : brandAssets.slice(2)
  return <div className="brand-downloads">{assets.map(asset => <DemoAsset key={asset.src} {...asset} />)}</div>
}

export function BrandKit() {
  return <p className="brand-kit">
    <a href={brandKit.src} download className="ui-button"><IconDownload aria-hidden="true" />Download the brand kit (ZIP)</a>
    <a href={brandKit.manifest} className="ui-button" data-variant="quiet">Asset manifest</a>
  </p>
}
