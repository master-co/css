import Link from 'next/link'

import Demo from '~/site/components/demo/Demo'
import DemoExample from '~/site/components/demo/DemoExample'
import DemoMotion from '~/site/components/demo/DemoMotion'
import { DemoItem, DemoLabel } from '~/site/components/demo'
import './page.css'

export const metadata = {
  title: 'Demo motion review',
  description: 'Current Demo motion and practical examples.'
}

function Preview() {
  return <Demo padding="none"><div className="review-motion-currentPreview">
    <DemoMotion><div className="review-motion-scene">
      <DemoItem tone="blue" className="display:grid place-content:center height:4rem width:4rem animation-name:rotate animation-duration:2s animation-timing-function:linear animation-iteration-count:infinite">↗</DemoItem>
    </div></DemoMotion>
  </div></Demo>
}

const options = [
  {
    number: '01', title: 'Current', detail: 'Separated stage and control deck',
    note: 'A fine frame contains the animated stage, while a quiet adjacent deck gives playback controls their own place without entering the scene.',
    preview: <Preview />
  }
] as const

export default function Page() {
  return <main className="review-motion-review">
    <div className="review-motion-kicker">Design system · Component review 15</div>
    <h1>Demo motion</h1>
    <p className="review-motion-intro">A fine frame contains the animated stage, while a quiet adjacent deck gives playback controls their own place without entering the scene.</p>

    <section aria-labelledby="motion-options">
      <h2 id="motion-options">Playback for one specimen</h2>

      <div className="review-motion-options">
        {options.map(({ number, title, detail, note, preview }) => <article className="review-motion-option" key={number}>
          <div className="review-motion-optionHeading"><span>{number}</span><div><h3>{title}</h3><p>{detail}</p></div></div>
          <div className="review-motion-optionPreview">{preview}</div>
          <p className="review-motion-optionNote">{note}</p>
        </article>)}
      </div>
    </section>

    <section aria-labelledby="motion-real-use">
      <div className="review-motion-sectionHeading">
        <div><h2 id="motion-real-use">Actual Reference use</h2><p>The animation play-state reference uses a native checkbox and real CSS conditions, independent of shared playback chrome.</p></div>
        <Link href="https://developer.mozilla.org/en-US/docs/Web/CSS/animation-play-state">Open https://developer.mozilla.org/en-US/docs/Web/CSS/animation-play-state</Link>
      </div>
      <DemoExample page="animation-play-state" section="run-an-animation" />
      <p className="review-motion-optionNote">The control in that lesson directly changes the element’s CSS play state. Shared playback controls are for explaining an animation timeline when the lesson itself does not supply a control.</p>
    </section>
  </main>
}
