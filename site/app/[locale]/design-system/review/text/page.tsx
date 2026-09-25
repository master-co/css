import Link from 'next/link'
import OriginalDemo from '~/site/docs-shell/components/Demo'
import OriginalDemoP from '~/site/docs-shell/components/DemoP'
import Demo from '~/site/components/demo/Demo'
import { DemoMedia, DemoSurface, DemoText } from '~/site/components/demo'
import './page.css'

export const metadata = {
  title: 'Demo text review',
  description: 'Review-only comparison of original Guide text, current site text and proposed type roles.'
}

const bodyCopy = 'Text wraps around the floated image and continues in the remaining inline space. Reset the float when the image should return to normal document flow.'

function FloatExample({ adopted }: { adopted: boolean }) {
  return (
    <Demo title="Text flow" caption="The width and float belong to the lesson; text stays in normal flow.">
      <DemoSurface className="flow-root p-md font-sm">
        <DemoMedia src="/demo/landscape.svg" width={112} height={70} alt="Sun above layered mountains" className="float:left h:auto w:7rem mb-sm mr-md r-sm" />
        {adopted ? <DemoText className="m:0">{bodyCopy}</DemoText> : <p className="m:0 demo-text">{bodyCopy}</p>}
      </DemoSurface>
    </Demo>
  )
}

export default function Page() {
  return (
    <main className="review-text-review">
      <div className="review-text-kicker">Design system · Component review 04</div>
      <h1>Demo text</h1>
      <p className="review-text-intro">The original Guide gives large specimen copy presence. The shared text element needs that option while keeping ordinary instructional paragraphs readable and layout neutral.</p>
      <div className="review-text-reviewNote" role="note">Approved direction: <code>DemoText</code> now exposes body, lead and caption roles. Default body text keeps its inherited size, line height and margin reset; optional roles do not enter measured examples unless requested.</div>

      <section aria-labelledby="text-comparison">
        <h2 id="text-comparison">Default and display copy</h2>
        <div className="review-text-comparison">
          <article className="review-text-option">
            <div className="review-text-optionHeading"><span>01</span><div><h3>Original Guide</h3><p><code>DemoP</code> specimen</p></div></div>
            <OriginalDemo><div className="review-text-textStage"><OriginalDemoP>Designing for consistency across every platform.</OriginalDemoP></div></OriginalDemo>
            <p className="review-text-optionNote">Strong, enlarged display copy from the established typography lesson.</p>
          </article>
          <article className="review-text-option">
            <div className="review-text-optionHeading"><span>02</span><div><h3>Previous</h3><p>Plain <code>DemoText</code></p></div></div>
            <Demo><div className="review-text-textStage"><p className="demo-text">Designing for consistency across every platform.</p></div></Demo>
            <p className="review-text-optionNote">Useful for paragraphs, but visually flat as a specimen.</p>
          </article>
          <article className="review-text-option">
            <div className="review-text-optionHeading"><span>03</span><div><h3>Adopted</h3><p>Explicit lead role</p></div></div>
            <Demo><div className="review-text-textStage"><DemoText variant="lead">Designing for consistency across every platform.</DemoText></div></Demo>
            <p className="review-text-optionNote">A measured type step, firmer weight and tighter rhythm without making every paragraph large.</p>
          </article>
        </div>
      </section>

      <section aria-labelledby="text-variants">
        <h2 id="text-variants">Three type roles</h2>
        <p className="review-text-sectionCopy">Role is content presentation. Class utilities remain available when the lesson is specifically about font size, line height or wrapping.</p>
        <Demo>
          <div className="review-text-roleStack">
            <div className="review-text-roleRow"><span>Lead</span><DemoText variant="lead">Give the important sentence room to breathe.</DemoText></div>
            <div className="review-text-roleRow"><span>Body</span><DemoText>Explanatory copy stays close to the surrounding example and inherits its font size.</DemoText></div>
            <div className="review-text-roleRow"><span>Caption</span><DemoText variant="caption">A compact note names the shown condition or result.</DemoText></div>
          </div>
        </Demo>
      </section>

      <section aria-labelledby="text-real-use">
        <div className="review-text-sectionHeading">
          <div><h2 id="text-real-use">Actual Reference use</h2><p>Text flow must remain the same beside a floated object.</p></div>
          <Link href="/reference/float">Open /reference/float</Link>
        </div>
        <div className="review-text-actualPair">
          <div><span className="review-text-pairLabel">Previous body text</span><FloatExample adopted={false} /></div>
          <div><span className="review-text-pairLabel">Adopted body text</span><FloatExample adopted /></div>
        </div>
        <p className="review-text-optionNote">Both paragraphs use the same source text and the same inherited <code>font-sm</code>; the lead and caption styles do not enter the float lesson.</p>
      </section>
    </main>
  )
}
