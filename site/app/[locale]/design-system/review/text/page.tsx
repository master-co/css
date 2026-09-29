import Link from 'next/link'
import Demo from '~/site/components/demo/Demo'
import { DemoMedia, DemoSurface, DemoText } from '~/site/components/demo'
import './page.css'

export const metadata = {
  title: 'Demo text review',
  description: 'The current Demo text roles and layout-neutral body copy.'
}

const bodyCopy = 'Text wraps around the floated image and continues in the remaining inline space. Reset the float when the image should return to normal document flow.'

function FloatExample() {
  return (
    <Demo title="Text flow" caption="The width and float belong to the lesson; text stays in normal flow.">
      <DemoSurface className="display:flow-root p-md font-size-sm">
        <DemoMedia src="/demo/landscape.svg" width={112} height={70} alt="Sun above layered mountains" className="float:left height:auto width:7rem mb-sm mr-md r-sm" />
        <DemoText className="margin:0">{bodyCopy}</DemoText>
      </DemoSurface>
    </Demo>
  )
}

export default function Page() {
  return (
    <main className="review-text-review">
      <div className="review-text-kicker">Design system · Component review 04</div>
      <h1>Demo text</h1>
      <p className="review-text-intro">Shared text has body, lead and caption roles. Body copy keeps its inherited size and remains neutral inside measured layouts.</p>

      <section aria-labelledby="text-current">
        <h2 id="text-current">Default and display copy</h2>
        <div className="review-text-current">
          <article className="review-text-option">
            <div className="review-text-optionHeading"><span>01</span><div><h3>Current text</h3><p>Explicit lead role</p></div></div>
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
          <Link href="https://developer.mozilla.org/en-US/docs/Web/CSS/float">Open https://developer.mozilla.org/en-US/docs/Web/CSS/float</Link>
        </div>
        <div className="review-text-actualUse">
          <div><span className="review-text-useLabel">Body text</span><FloatExample /></div>
        </div>
        <p className="review-text-optionNote">The paragraph inherits <code>font-size-sm</code>; lead and caption styles do not enter the float lesson.</p>
      </section>
    </main>
  )
}
