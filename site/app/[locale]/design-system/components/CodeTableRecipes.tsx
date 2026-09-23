import { DocumentCodeTable } from '~/site/components/DocumentValues'

export default function CodeTableRecipes() {
  return <DocumentCodeTable label="Token" rows={[
    { syntax: '@component', css: '@layer components' },
    { syntax: '@reduce-motion', css: '@media (prefers-reduced-motion: reduce)' },
    { syntax: '@supports(<feature>)', css: '@supports (<feature>)' },
  ]} />
}
