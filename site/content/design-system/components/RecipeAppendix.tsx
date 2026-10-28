import DocumentDisclosure from '~/site/components/DocumentDisclosure'
import ProjectStyleRecipes from './ProjectStyleRecipes'
import FoundationRecipes from './FoundationRecipes'
import TypeMotionRecipes from './TypeMotionRecipes'
import PaintRecipes from './PaintRecipes'
import NamespaceRecipes from './NamespaceRecipes'
import CodeTableRecipes from './CodeTableRecipes'
import DemoRecipes from './DemoRecipes'
import SyntaxViewportGallery from './SyntaxViewportGallery'
import { recipeGroups } from './catalog'

const recipes = [ProjectStyleRecipes, FoundationRecipes, TypeMotionRecipes, PaintRecipes, NamespaceRecipes, CodeTableRecipes, SyntaxViewportGallery, DemoRecipes]

/** Keep the full source-backed collection available without mounting it on the overview. */
export default function RecipeAppendix() {
  return <div className="ds-recipe-appendix">{recipeGroups.map((group, index) => {
    const Recipe = recipes[index]
    return <DocumentDisclosure key={group.id} title={group.title}><div className="scroll-margin-top:6rem" id={group.id}><Recipe /></div></DocumentDisclosure>
  })}</div>
}
