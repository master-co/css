import Link from 'next/link'
import Demo from '~/site/components/demo/Demo'
import { DemoMedia, DemoSurface, DemoText } from '~/site/components/demo'
import './page.css'

export const metadata = {
  title: 'Demo media review',
  description: 'The shared Demo media and its text flow example.'
}

function FloatExample() {
  return (
    <Demo title="Text flow" caption="The image floats left. Width, spacing and float belong to the lesson.">
      <DemoSurface className="display:flow-root p-md font-size-sm">
        <DemoMedia src="/demo/landscape.svg" width={112} height={70} alt="Sun above layered mountains" className="float:left height:auto width:7rem mb-sm mr-md r-sm" />
        <DemoText className="margin:0">Text wraps around the floated image and continues in the remaining inline space. Reset the float when the image should return to normal document flow.</DemoText>
      </DemoSurface>
    </Demo>
  )
}

export default function Page() {
  return (
    <main className="review-media-review">
      <div className="review-media-kicker">Design system · Component review 03</div>
      <h1>Demo media</h1>
      <p className="review-media-intro">Shared media keeps supplied images native and provides a quiet SVG illustration for layout and color lessons. The caller supplies dimensions, crop, float and accessibility text.</p>

      <section aria-labelledby="media-current">
        <h2 id="media-current">Default visual</h2>
        <div className="review-media-current">
          <article className="review-media-option">
            <div className="review-media-optionHeading"><span>01</span><div><h3>Current media</h3><p>Shared SVG illustration</p></div></div>
            <Demo><div className="review-media-mediaStage"><DemoMedia className="review-media-mediaSpecimen" /></div></Demo>
            <p className="review-media-optionNote">Measured contour lines, quieter fills and a hairline edge within the same box.</p>
          </article>
        </div>
      </section>

      <section aria-labelledby="media-variants">
        <h2 id="media-variants">SVG color and supplied image</h2>
        <p className="review-media-sectionCopy">The fallback uses <code>currentColor</code>, so actual utility classes determine the subject color. A supplied <code>src</code> keeps its own pixels and alt text.</p>
        <Demo>
          <div className="review-media-variantGrid">
            <div><span className="review-media-variantLabel">Subject · blue</span><DemoMedia className={`fg-demo-blue review-media-mediaSpecimen`} aria-label="Blue outlined mountain landscape" /></div>
            <div><span className="review-media-variantLabel">Comparison · violet</span><DemoMedia className={`fg-demo-violet review-media-mediaSpecimen`} aria-label="Violet outlined mountain landscape" /></div>
            <div><span className="review-media-variantLabel">Asset · source supplied</span><DemoMedia src="/demo/landscape.svg" alt="Sun above layered mountains" width={320} height={200} className="review-media-mediaSpecimen" /></div>
          </div>
        </Demo>
        <p className="review-media-optionNote">The component adds no width, height, object fit, float, overflow or interaction style. Its thin edge does not take layout space.</p>
      </section>

      <section aria-labelledby="media-real-use">
        <div className="review-media-sectionHeading">
          <div><h2 id="media-real-use">Actual Reference use</h2><p>Float changes paragraph geometry, so the image box must stay identical.</p></div>
          <Link href="https://developer.mozilla.org/en-US/docs/Web/CSS/float">Open https://developer.mozilla.org/en-US/docs/Web/CSS/float</Link>
        </div>
        <div className="review-media-actualUse">
          <div><span className="review-media-useLabel">Shared media</span><FloatExample /></div>
        </div>
        <p className="review-media-optionNote">The image uses a real <code>float:left</code> class and a 112 × 70 displayed box. Its visual edge does not change text flow.</p>
      </section>
    </main>
  )
}
