import Link from 'next/link'

import ThemeSelect from '~/site/docs-shell/components/ThemeSelect'
import DemoAsset from '~/site/components/demo/DemoAsset'
import DemoExample from '~/site/components/demo/DemoExample'
import './page.css'

export const metadata = {
  title: 'Demo asset review',
  description: 'Current Demo asset and practical examples.'
}

const asset = {
  title: 'Logotype for dark backgrounds',
  description: 'Light lettering with the original gold mark.',
  src: '/images/css-logotype@dark.svg',
  alt: 'Master CSS logotype with light lettering',
  width: 460,
  height: 55,
  surface: 'dark' as const
}

const options = [
  {
    number: '01', title: 'Current', detail: 'Clear asset and action hierarchy',
    note: 'The same artwork keeps its transparent pixels in either page theme, with clearer metadata, a file-type tag and a stronger download target.',
    preview: <DemoAsset {...asset} />
  }
] as const

export default function Page() {
  return <main className="review-asset-review">
    <div className="review-asset-kicker">Design system · Component review 25</div>
    <h1>Demo asset</h1>
    <p className="review-asset-intro">The same artwork keeps its transparent pixels in either page theme, with clearer metadata, a file-type tag and a stronger download target.</p>

    <label htmlFor="asset-review-theme" className="review-asset-themeControl"><span>Preview theme</span><span className="review-asset-themeSelect">Light · Dark · System<ThemeSelect id="asset-review-theme" aria-label="Preview theme" /></span></label>

    <section aria-labelledby="asset-options">
      <h2 id="asset-options">Dark-background logotype</h2>

      <div className="review-asset-options">
        {options.map(({ number, title, detail, note, preview }) => <article className="review-asset-option" key={number}>
          <div className="review-asset-optionHeading"><span>{number}</span><div><h3>{title}</h3><p>{detail}</p></div></div>
          <div className="review-asset-optionPreview">{preview}</div>
          <p className="review-asset-optionNote">{note}</p>
        </article>)}
      </div>
    </section>

    <section aria-labelledby="asset-surfaces">
      <h2 id="asset-surfaces">Real Brand variants</h2>

      <div className="review-asset-surfaceGrid">
        <DemoAsset title="Logotype for light backgrounds" description="Dark lettering with the original gold mark." src="/images/css-logotype@light.svg" alt="Master CSS logotype with dark lettering" width={460} height={55} surface="light" />
        <DemoAsset title="Master CSS mark" description="Original artwork on a transparency preview." src="/images/logo.svg" alt="Master CSS gold mark" width={104} height={56} />
      </div>
      <Link className="review-asset-bodyLink" href="/brand#download-assets">Open all assets on /brand</Link>
    </section>

    <section aria-labelledby="asset-real-use">
      <div className="review-asset-sectionHeading">
        <div><h2 id="asset-real-use">Actual Reference media scene</h2><p>The background-image lesson uses imagery as a CSS teaching subject; the asset card is for viewing and downloading artwork.</p></div>
        <Link href="https://developer.mozilla.org/en-US/docs/Web/CSS/background-image">Open https://developer.mozilla.org/en-US/docs/Web/CSS/background-image</Link>
      </div>
      <DemoExample page="background-image" section="add-a-background-image" />
    </section>
  </main>
}
