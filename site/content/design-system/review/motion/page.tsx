import metadata from './metadata'
import ComponentDocumentation from './content.mdx'
import ComponentPage from '../../components/ComponentPage'
import Demo from '~/site/components/demo/Demo'
import DemoExample from '~/site/components/demo/DemoExample'
import DemoMotion from '~/site/components/demo/DemoMotion'
import { DemoItem } from '~/site/components/demo'

export { metadata }

export default function Page() {
  return <ComponentPage title="Player" description="A native animation starts paused. Play, Pause and Replay control its real timeline; reduced motion pauses it again." sections={[
    { id: 'player', title: 'A paused timeline', children: <Demo caption="The player reads the actual animation state.">
      <DemoMotion><div className="grid (place-items:center) py-md">
        <DemoItem tone="blue" className="(height:4rem) (width:4rem) (animation-duration:2s) (animation-iteration-count:infinite) (animation-name:rotate) (animation-timing-function:linear)">↗</DemoItem>
      </div></DemoMotion>
    </Demo> },
    { id: 'reference', title: 'In a reference specimen', children: <DemoExample page="animation-play-state" section="run-an-animation" /> },
  ]} usage={{ href: '/guide/theme', label: 'the Theme guide' }} Documentation={ComponentDocumentation} />
}
