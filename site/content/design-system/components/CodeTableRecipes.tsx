import { DocumentCodeTable } from '~/site/components/DocumentValues'
import { codeTableRecipeRows } from './catalog'

export default function CodeTableRecipes() {
  return <DocumentCodeTable label="Token" rows={codeTableRecipeRows} />
}
