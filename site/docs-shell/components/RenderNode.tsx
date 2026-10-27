import type { ReactNode } from 'react'

/** Lets an Astro page render a React tree it has already composed. */
export default function RenderNode({ node }: { node: ReactNode }) {
  return <>{node}</>
}
