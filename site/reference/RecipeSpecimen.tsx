import Demo from '../components/demo/Demo'
import DemoViewport from '../components/demo/DemoViewport'
import { demoDocument } from '../components/demo/reference/document'
import { recipeScene } from '../common/foundation-data/recipe-specimens'

export default function RecipeSpecimen({ id }: { id: string }) {
  const scene = recipeScene(id)
  const title = `${id.replaceAll('-', ' ')} in use`
  return <Demo title={title} padding="none" background="plain" caption={scene.caption} data-recipe-specimen={id}>
    <DemoViewport title={title} document={demoDocument({ page: id, id: 'examples', title, html: [], css: '', classes: [], classLists: [], highlighted: [] }, scene)} sizing="content" motion={scene.motion} theme />
  </Demo>
}
