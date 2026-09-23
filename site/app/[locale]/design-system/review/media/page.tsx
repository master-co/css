import Link from 'next/link'
import Image from 'next/image'
import OriginalDemo from 'internal/components/Demo'
import Demo from '~/site/components/demo/Demo'
import { DemoMedia, DemoSurface, DemoText } from '~/site/components/demo'
import styles from './page.module.css'

export const metadata = {
  title: 'Demo media review',
  description: 'Review-only comparison of the original guide image, current media and refined media candidate.'
}

function PreviousVector() {
  return <svg viewBox="0 0 320 200" role="img" aria-label="Landscape with a sun and mountains" className={`${styles.mediaSpecimen} ${styles.mediaPrevious}`}>
    <rect width="320" height="200" fill="currentColor" opacity=".12" />
    <circle cx="240" cy="54" r="24" fill="currentColor" opacity=".55" />
    <path d="M0 200 100 50 205 200Z" fill="currentColor" opacity=".8" />
    <path d="m120 200 90-110 110 110Z" fill="currentColor" opacity=".4" />
  </svg>
}

function FloatExample({ adopted }: { adopted: boolean }) {
  return (
    <Demo title="Text flow" caption="The image floats left. Width, spacing and float belong to the lesson.">
      <DemoSurface className="flow-root p:md font:sm">
        {adopted
          ? <DemoMedia src="/demo/landscape.svg" width={112} height={70} alt="Sun above layered mountains" className="float:left h:auto w:28x mb:sm mr:md r:sm" />
          : <Image src="/demo/landscape.svg" width={112} height={70} unoptimized alt="Sun above layered mountains" className="float:left h:auto w:28x mb:sm mr:md r:sm" />}
        <DemoText className="m:0">Text wraps around the floated image and continues in the remaining inline space. Reset the float when the image should return to normal document flow.</DemoText>
      </DemoSurface>
    </Demo>
  )
}

export default function Page() {
  return (
    <main className={styles.review}>
      <div className={styles.kicker}>Design system · Component review 03</div>
      <h1>Demo media</h1>
      <p className={styles.intro}>The Guide already uses real imagery well. The adopted shared media keeps supplied images native and gives the SVG fallback quieter illustration detail for layout and color lessons.</p>
      <div className={styles.reviewNote} role="note">Approved direction: the refined SVG and thin visual edge are now shared. The image source, intrinsic dimensions, crop, float and accessibility text remain the caller&apos;s responsibility.</div>

      <section aria-labelledby="media-comparison">
        <h2 id="media-comparison">Default visual</h2>
        <div className={styles.comparison}>
          <article className={styles.option}>
            <div className={styles.optionHeading}><span>01</span><div><h3>Original Guide</h3><p>Introduction image</p></div></div>
            <OriginalDemo><div className={styles.mediaStage}><Image src="/building.jpg" width={320} height={200} alt="Modern white architecture beneath a blue sky" className={styles.mediaSpecimen} /></div></OriginalDemo>
            <p className={styles.optionNote}>A real, well composed photograph remains the right choice when content is visual.</p>
          </article>
          <article className={styles.option}>
            <div className={styles.optionHeading}><span>02</span><div><h3>Previous</h3><p>Shared SVG fallback</p></div></div>
            <Demo><div className={styles.mediaStage}><PreviousVector /></div></Demo>
            <p className={styles.optionNote}>Simple saturated mountains; no asset is required.</p>
          </article>
          <article className={styles.option}>
            <div className={styles.optionHeading}><span>03</span><div><h3>Adopted</h3><p>Shared SVG fallback</p></div></div>
            <Demo><div className={styles.mediaStage}><DemoMedia className={styles.mediaSpecimen} /></div></Demo>
            <p className={styles.optionNote}>Measured contour lines, quieter fills and a hairline edge within the same box.</p>
          </article>
        </div>
      </section>

      <section aria-labelledby="media-variants">
        <h2 id="media-variants">SVG color and supplied image</h2>
        <p className={styles.sectionCopy}>The fallback uses <code>currentColor</code>, so actual utility classes determine the subject color. A supplied <code>src</code> keeps its own pixels and alt text.</p>
        <Demo>
          <div className={styles.variantGrid}>
            <div><span className={styles.variantLabel}>Subject · blue</span><DemoMedia className={`${styles.mediaSpecimen} fg:demo-blue`} aria-label="Blue outlined mountain landscape" /></div>
            <div><span className={styles.variantLabel}>Comparison · violet</span><DemoMedia className={`${styles.mediaSpecimen} fg:demo-violet`} aria-label="Violet outlined mountain landscape" /></div>
            <div><span className={styles.variantLabel}>Asset · source supplied</span><DemoMedia src="/demo/landscape.svg" alt="Sun above layered mountains" width={320} height={200} className={styles.mediaSpecimen} /></div>
          </div>
        </Demo>
        <p className={styles.optionNote}>The component adds no width, height, object fit, float, overflow or interaction style. Its thin edge does not take layout space.</p>
      </section>

      <section aria-labelledby="media-real-use">
        <div className={styles.sectionHeading}>
          <div><h2 id="media-real-use">Actual Reference use</h2><p>Float changes paragraph geometry, so the image box must stay identical.</p></div>
          <Link href="/reference/float">Open /reference/float</Link>
        </div>
        <div className={styles.actualPair}>
          <div><span className={styles.pairLabel}>Previous media</span><FloatExample adopted={false} /></div>
          <div><span className={styles.pairLabel}>Adopted media</span><FloatExample adopted /></div>
        </div>
        <p className={styles.optionNote}>Both examples use the same real <code>float:left</code> class and the same 112 × 70 displayed image box. The edge is visual only; the text wrap should match.</p>
      </section>
    </main>
  )
}
