import Demo from './Demo'
import DemoViewport from './DemoViewport'
import { referenceDemoSections } from './reference/source'
import { referenceScenes } from './reference/scenes'
import { demoDocument } from './reference/document'

export default async function DemoExample({ page, section }: { page: string, section: string }) {
  const source = (await referenceDemoSections(page)).find(item => item.id === section)
  if (!source) throw new Error(`Missing demo source: ${page}#${section}`)
  const factory = referenceScenes[page]
  if (!factory) throw new Error(`Missing demo scene: ${page}`)
  const scene = factory(source)
  const responsive = source.classes.some(value => /(?:@|&)(?:sm|md|lg|xl|[\d.]+(?:px|rem))\b/.test(value))
  const themed = source.classes.some(value => /@(?:dark|light)\b/.test(value))
  const printable = source.classes.some(value => value.includes('@print'))
  return (
    <Demo title={source.title} padding="none" caption={scene.caption} data-demo-case={`${page}#${section}`}>
      <DemoViewport title={`${page}: ${source.title}`} document={demoDocument(source, scene)} responsive={scene.responsive ?? responsive}
        theme={scene.theme ?? themed} print={printable} motion={scene.motion} inspect={scene.inspect ?? (section === 'apply-conditionally' ? [page] : undefined)} height={scene.height} maxWidth={scene.maxWidth} sizing={scene.sizing} />
    </Demo>
  )
}
