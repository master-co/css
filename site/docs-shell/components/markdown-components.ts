import '~/site/styles/system/data.css'
import Image from './Image.svelte'
import Do from './Do.astro'
import DoNot from './DoNot.astro'
import Info from './Info.astro'
import InteractingIndicator from './InteractingIndicator.astro'
import PMAction from './PMAction.astro'
import Warn from './Warn.astro'
import InlineCode from './InlineCode.astro'
import Code from './Code.astro'
import Anchor from './markdown/Anchor.astro'
import Heading2 from './markdown/Heading2.astro'
import Heading3 from './markdown/Heading3.astro'
import Table from './markdown/Table.astro'

/**
 * How Markdown renders in MDX. Every MDX module exports these as `components` (see
 * `docs-shell/remark/markdown-components.js`, which also turns fences, inline code and
 * marked paragraphs into the `Code`, `InlineCode`, callout and hint elements).
 */
export const markdownComponents = {
  a: Anchor,
  h2: Heading2,
  h3: Heading3,
  img: Image,
  Image,
  table: Table,
  Code,
  InlineCode,
  PMAction,
  Do,
  DoNot,
  Info,
  Warn,
  InteractingIndicator
}
