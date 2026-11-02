import DocumentDisclosure from '../components/DocumentDisclosure'
import Demo from '../components/demo/Demo'
import DemoViewport from '../components/demo/DemoViewport'
import { demoDocument } from '../components/demo/reference/document'
import { foundationScene } from '../common/foundation-data/specimens'
import type { SheetGroup } from './sheets'

/** Keep the existing native playback comparisons, selected by the complete lookup table. */
export default function TokenMotionScale({ group }: { group: SheetGroup }) {
  if (!['animate', 'duration', 'easing'].includes(group.namespace)) return null
  const scene = foundationScene(group.namespace, group.values.map(value => value.key))
  // Curves may travel beyond either endpoint. Reserve proportional paint room at every frame width.
  if (group.namespace !== 'animate') scene.css += ' [data-motion-path] { margin-inline:16%; }'
  const title = `Compare all ${{ animate: 'animations', duration: 'durations', easing: 'easing curves' }[group.namespace]}`
  const caption = group.namespace === 'animate'
    ? 'Each preset animation runs once here and starts paused. Play, Pause and Replay control the native timelines. Reduced motion keeps the content still; the table above retains the complete preset shorthands.'
    : scene.caption
  return <DocumentDisclosure title={title}>
    <Demo frame="none" caption={caption}>
      <DemoViewport title={title} document={demoDocument({ page: 'tokens', id: group.namespace, title, html: [], css: '', classes: [], classLists: [], highlighted: [] }, scene)} sizing="content" motion />
    </Demo>
  </DocumentDisclosure>
}
