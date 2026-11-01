import metadata from './metadata'
import ComponentDocumentation from './content.mdx'
import ComponentPage from '../../components/ComponentPage'
import Segments from '~/site/docs-shell/components/Segments'
import Demo from '~/site/components/demo/Demo'
import ButtonPreview from '~/site/content/guide/syntax-tutorial/components/ButtonPreview'
import ControlsReviewScene, { ControlsGallery } from './ControlsReviewScene'

export { metadata }

export default function Page() {
  return <ComponentPage title="Buttons and inputs" description="Controls share one material: a raised face that lifts half a pixel on hover, sinks into a well when pressed and always shows an ink focus ring. Hue never expresses state." sections={[
    { id: 'gallery', title: 'Every control', children: <ControlsGallery /> },
    { id: 'segmented', title: 'Exclusive choices in a tray head', description: 'A segmented control in the tray head changes the actual utility on the specimen.', children: <ControlsReviewScene /> },
    { id: 'document-views', title: 'Related document views', description: 'Arrow keys move between views; Home and End reach the first and last; Tab moves into the selected panel.', children: <Segments label="Document view example">{[
      { name: 'Overview', content: <p>A short explanation stays beside the example.</p> },
      { name: 'Details', content: <p>Supporting details remain available in the HTML, including when JavaScript is disabled.</p> }
    ]}</Segments> },
    { id: 'viewport-conditions', title: 'Viewport conditions', description: 'The presets cross the sm breakpoint inside a real iframe; the button padding follows that viewport.', children: <Demo frame="none" title="Responsive button padding">
      <ButtonPreview responsive classes={['p-md', 'p-lg@sm', 'fg-blue-60:hover', 'fg-blue-60:focus-visible']} />
    </Demo> },
  ]} usage={{ href: '/guide/syntax-tutorial#conditions', label: 'the Syntax Tutorial' }} Documentation={ComponentDocumentation} />
}
