import { DocumentCodeTable } from '~/site/components/DocumentValues'

export default function CodeTableRecipes() {
  return <DocumentCodeTable label="Token" rows={[
    { syntax: '@layer(components)', css: '@layer components' },
    { syntax: '@motion-reduce', css: '@media (prefers-reduced-motion: reduce)' },
    { syntax: '@supports(<feature>)', css: '@supports (<feature>)' },
  ]} />
}
