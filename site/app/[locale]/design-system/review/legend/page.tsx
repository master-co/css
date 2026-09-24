import Link from 'next/link'
import OriginalDemo from '~/site/docs-shell/components/Demo'
import OriginalDemoLabel from '~/site/docs-shell/components/DemoLabel'
import Demo from '~/site/components/demo/Demo'
import DemoExample from '~/site/components/demo/DemoExample'
import { DemoLegend } from '~/site/components/demo'
import styles from './page.module.css'

export const metadata = {
  title: 'Demo legend review',
  description: 'The original Guide label pattern, previous shared legend and approved refined legend.'
}

const items = [
  { tone: 'blue', label: 'Subject border' },
  { tone: 'violet', label: 'Comparison border' }
] as const

function BorderSpecimens() {
  return <div className={styles.specimens}>
    <div className={`${styles.specimen} b:2px|solid|var(--color-blue) surface-raised`}>Subject</div>
    <div className={`${styles.specimen} b:2px|solid|var(--color-violet) surface-raised`}>Comparison</div>
  </div>
}

function PreviousLegend() {
  return <ul className={styles.previousLegend} aria-label="Legend">
    {items.map(({ tone, label }) => <li key={label}><span className={styles.previousMarker} data-tone={tone} aria-hidden="true" />{label}</li>)}
  </ul>
}

const options = [
  {
    number: '01', title: 'Original Guide', detail: 'Labels beside the objects',
    note: 'The original Guide has no standalone legend; its small labels identify individual specimens directly.',
    preview: <OriginalDemo><div className={styles.originalContent}><div className={styles.originalItems}>
      <div><OriginalDemoLabel>Subject border</OriginalDemoLabel><div className={`${styles.specimen} b:2px|solid|var(--color-blue) surface-raised`}>Subject</div></div>
      <div><OriginalDemoLabel>Comparison border</OriginalDemoLabel><div className={`${styles.specimen} b:2px|solid|var(--color-violet) surface-raised`}>Comparison</div></div>
    </div></div></OriginalDemo>
  },
  {
    number: '02', title: 'Previous', detail: 'Earlier shared DemoLegend',
    note: 'A separate compact key pairs every color with a name outside the teaching layout.',
    preview: <Demo caption={<PreviousLegend />}><BorderSpecimens /></Demo>
  },
  {
    number: '03', title: 'Adopted', detail: 'Readable annotation key',
    note: 'Slightly larger monospace labels and precise bordered swatches improve scanning while keeping the key outside the scene.',
    preview: <Demo caption={<DemoLegend items={[...items]} />}><BorderSpecimens /></Demo>
  }
] as const

export default function Page() {
  return <main className={styles.review}>
    <div className={styles.kicker}>Design system · Component review 09</div>
    <h1>Demo legend</h1>
    <p className={styles.intro}>A legend explains recurring color roles after the specimen. The adopted shared legend keeps the Guide’s plain text character and gives each keyed color a more deliberate mark and readable label.</p>
    <div className={styles.reviewNote} role="note">Approved direction: the shared <code>DemoLegend</code> uses the refined key. The original Guide uses attached labels instead of a separate legend and remains unchanged.</div>

    <section aria-labelledby="legend-options">
      <h2 id="legend-options">Border color comparison</h2>
      <p className={styles.sectionCopy}>The subject and comparison objects are the same in each treatment. The key lives outside their layout, so it cannot change the border lesson.</p>
      <div className={styles.options}>
        {options.map(({ number, title, detail, note, preview }) => <article className={styles.option} key={number}>
          <div className={styles.optionHeading}><span>{number}</span><div><h3>{title}</h3><p>{detail}</p></div></div>
          <div className={styles.optionPreview}>{preview}</div>
          <p className={styles.optionNote}>{note}</p>
        </article>)}
      </div>
    </section>

    <section aria-labelledby="legend-real-use">
      <div className={styles.sectionHeading}>
        <div><h2 id="legend-real-use">Actual Reference use</h2><p>The border-color reference compares the same border width and style in blue and violet.</p></div>
        <Link href="/reference/border-color#set-border-color">Open /reference/border-color</Link>
      </div>
      <DemoExample page="border-color" section="set-border-color" />
      <p className={styles.optionNote}>The Reference retains its own caption and code comments. A legend is useful when a scene repeats these roles, and its text must carry the meaning without relying on color alone.</p>
    </section>
  </main>
}
