import Link from 'next/link'
import OriginalDemo from '~/site/docs-shell/components/Demo'
import Demo from '~/site/components/demo/Demo'
import DemoExample from '~/site/components/demo/DemoExample'
import DemoMotion from '~/site/components/demo/DemoMotion'
import { DemoItem, DemoLabel } from '~/site/components/demo'
import './page.css'

export const metadata = {
  title: 'Demo motion review',
  description: 'Original Guide motion specimen, previous shared playback and the adopted control-deck treatment.'
}

const original = <OriginalDemo><div className="review-motion-originalScene">
  <div className="review-motion-originalCard">
    <DemoLabel>animation:fade|slow|smooth</DemoLabel>
    <div className="size:3.5rem r-lg bg-blue-5 animation:fade|var(--duration-slow)|var(--easing-smooth)|infinite|alternate@motion" />
  </div>
  <div className="review-motion-originalCard">
    <DemoLabel>animation:zoom|fast|overshoot</DemoLabel>
    <div className="size:3.5rem r-lg bg-green-5 animation:zoom|var(--duration-fast)|var(--easing-overshoot)|infinite|alternate@motion" />
  </div>
</div></OriginalDemo>

function Preview({ candidate = false }: { candidate?: boolean }) {
  return <Demo padding="none"><div className={candidate ? 'review-motion-candidate' : 'review-motion-current'}>
    <DemoMotion><div className="review-motion-scene">
      <DemoItem tone="blue" className="grid place-content:center size:4rem animation:rotate|2s|linear|infinite">↗</DemoItem>
    </div></DemoMotion>
  </div></Demo>
}

const options = [
  {
    number: '01', title: 'Original Guide', detail: 'Two ambient motion tokens',
    note: 'The Motion Guide keeps its authored pair of examples and applies animation only when motion is allowed by the user preference.',
    preview: original
  },
  {
    number: '02', title: 'Previous', detail: 'Shared playback controls',
    note: 'The previous shared scene started paused and supported Play, Pause and Replay, but the edge between stage and controls was implicit.',
    preview: <Preview />
  },
  {
    number: '03', title: 'Adopted', detail: 'Separated stage and control deck',
    note: 'A fine frame contains the animated stage, while a quiet adjacent deck gives playback controls their own place without entering the scene.',
    preview: <Preview candidate />
  }
] as const

export default function Page() {
  return <main className="review-motion-review">
    <div className="review-motion-kicker">Design system · Component review 15</div>
    <h1>Demo motion</h1>
    <p className="review-motion-intro">An animated specimen needs an obvious place to play and controls that never become part of the movement. The Guide keeps its original token demonstration; both shared versions pause on load and animate the same item.</p>
    <div className="review-motion-reviewNote" role="note">Adopted default: the shared <code>DemoMotion</code> now separates its animation stage from the playback deck. Play, pause and replay the two shared examples. Replay restarts the actual animation timeline; the Guide continues to follow the OS motion preference.</div>

    <section aria-labelledby="motion-options">
      <h2 id="motion-options">Playback for one specimen</h2>
      <p className="review-motion-sectionCopy">The candidate changes the chrome surrounding the animation, not its duration, easing or rotation.</p>
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
        <Link href="/reference/animation-play-state#run-an-animation">Open /reference/animation-play-state</Link>
      </div>
      <DemoExample page="animation-play-state" section="run-an-animation" />
      <p className="review-motion-optionNote">The control in that lesson directly changes the element’s CSS play state. Shared playback controls are for explaining an animation timeline when the lesson itself does not supply a control.</p>
    </section>
  </main>
}
