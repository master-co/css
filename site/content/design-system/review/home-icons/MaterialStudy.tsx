import HoverInspection from '~/site/assets/images/home/icons/editor-hover-inspection.svg'
import hoverLight from '~/site/assets/images/home/icons/artwork/editor-hover-inspection-light.webp'
import hoverDark from '~/site/assets/images/home/icons/artwork/editor-hover-inspection-dark.webp'
import '~/site/assets/images/home/icons/artwork.css'
import Image from '~/site/docs-shell/components/Image'
import { editorFeatures } from '~/site/content/components/editor-content'

const copy = editorFeatures.find(card => card.id === 'hover')!

export default function MaterialStudy() {
  return <section className="hir-material-study" id="material-study" aria-labelledby="material-study-heading">
    <p className="hir-eyebrow">Material study · SVG / WebP</p>
    <h2 id="material-study-heading">Dense class strings, still readable.</h2>
    <p className="hir-material-intro">The same homepage copy, 96px canvas and approximately 80% visible width. Compare the rendered materials on both card backgrounds.</p>
    {(['light', 'dark'] as const).map(theme => <div className={`hir-material-theme hir-${theme}`} key={theme}>
      <p className="hir-material-label">02 — Editor · {theme}</p>
      <div className="hir-material-pair">
        {(['svg', 'webp'] as const).map(format => <div className="hir-material-option" key={format}>
          <p>{format === 'svg' ? 'A · SVG' : 'B · WebP'}</p>
          <article className="hir-material-card">
            <MaterialIcon format={format} theme={theme} size={96} />
            <div><h3>{copy.title}</h3><p>{copy.body}</p></div>
          </article>
          <div className="hir-material-sizes">
            {[64, 80, 96, 160].map(size => <figure key={size}>
              <MaterialIcon format={format} theme={theme} size={size} />
              <figcaption>{size}px</figcaption>
            </figure>)}
          </div>
        </div>)}
      </div>
    </div>)}
  </section>
}

function MaterialIcon({ format, theme, size }: { format: 'svg' | 'webp', theme: 'light' | 'dark', size: number }) {
  return format === 'svg'
    ? <HoverInspection width={size} height={size} aria-hidden="true" focusable="false" />
    : <Image src={theme === 'light' ? hoverLight : hoverDark} width={size} height={size} className="home-icon-artwork" alt="" aria-hidden="true" loading="eager" />
}
