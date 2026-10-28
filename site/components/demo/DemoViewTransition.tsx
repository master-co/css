import Demo from './Demo'
import DemoViewport from './DemoViewport'

export default function DemoViewTransition({ example = 'views' }: { example?: 'views' | 'articles' }) {
  const articles = example === 'articles'
  const title = articles ? 'From collection to article' : 'A change of view'
  return <Demo title={title} padding="none" background="plain" frame="none" data-view-transition={example}
    caption={articles ? 'Open an article, then return to its card. Each image and title keeps a unique snapshot name. Keyboard focus follows the view change.' : 'Choose a view. The panel and heading use named snapshots; unsupported browsers and reduced motion use the same immediate update.'}>
    <DemoViewport title={title} src={articles ? '/examples/article-transitions' : '/examples/view-transitions'} height={articles ? 640 : 340} sizing="content" />
  </Demo>
}
