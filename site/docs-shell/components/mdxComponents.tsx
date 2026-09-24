import type { MDXComponents } from 'mdx/types'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import Do from './Do'
import DoNot from './DoNot'
import Info from './Info'
import InteractingIndicator from './InteractingIndicator'
import Demo from './Demo'
import DemoPanel from './DemoPanel'
import PMAction from './PMAction'
import Warn from './Warn'
import DocProp from './DocProp'
import DocFn from './DocFn'
import BrowserHeader from './BrowserHeader'
import HelloWorld from './HelloWorld'
import ImageCallToPreview from './ImageCallToPreview'
import InlineGood from './InlineGood'
import InlineBad from './InlineBad'
import InlineWarn from './InlineWarn'
import Dropped from './Dropped'
import ResizeZone from './ResizeZone'
import ArticleTOC from './ArticleTOC'
import IFrame from './IFrame'
import DocBadge from './DocBadge'
import DemoP from './DemoP'
import DemoLabel from './DemoLabel'
import StepSection, { Step, StepNum, StepL, StepR, StepEnd } from './StepSection'

const CodeTabs = dynamic(() => import('./CodeTabs'))
const InlineCode = dynamic(() => import('./InlineCode'))
const Code = dynamic(() => import('./Code'))
const DocHeading = dynamic(() => import('./DocHeading'))
const Resizable = dynamic(() => import('./Resizable'))
const Link = dynamic(() => import('./Link'))

// This file allows you to provide custom React components
// to be used in MDX files. You can import and use any
// React component you want, including components from
// other libraries.

function rehypeChildren(children: any, startsWith: string) {
  if (Array.isArray(children)) {
    let newChildren = [...children]
    if (newChildren[0]?.startsWith?.(startsWith)) {
      newChildren[0] = newChildren[0].replace(startsWith, '')
      return newChildren
    }
  } else {
    if (children.startsWith?.(startsWith)) {
      return children.replace(startsWith, '')
    }
  }
}

export const mdxComponents: MDXComponents = {
  code: (props: any) => {
    const splits = props.children.split(' ')
    let lang = ''
    let code = props.children
    if (splits.length > 1)
      switch (splits[0]) {
        case 'html':
        case 'js':
        case 'ts':
        case 'css':
        case 'json':
        case 'mcss':
          lang = splits.shift()
          code = splits.join(' ')
          break
      }
    else {
      code = splits[0]
    }
    return <InlineCode {...props} lang={lang}>{code}</InlineCode>
  },
  p: (props: any) => {
    let newChildren

    newChildren = rehypeChildren(props.children, '(o) ')
    if (newChildren) {
      return <Do {...props}>{newChildren}</Do>
    }

    newChildren = rehypeChildren(props.children, '(x) ')
    if (newChildren) {
      return <DoNot {...props}>{newChildren}</DoNot>
    }

    newChildren = rehypeChildren(props.children, '(i) ')
    if (newChildren) {
      return <Info {...props}>{newChildren}</Info>
    }

    newChildren = rehypeChildren(props.children, '(!) ')
    if (newChildren) {
      return <Warn {...props}>{newChildren}</Warn>
    }

    newChildren = rehypeChildren(props.children, '(!|) ')
    if (newChildren) {
      return <Warn {...props} leaded>{newChildren}</Warn>
    }

    newChildren = rehypeChildren(props.children, '(hover) ')
    if (newChildren) {
      return <InteractingIndicator {...props} icon="hover">{newChildren}</InteractingIndicator>
    }

    newChildren = rehypeChildren(props.children, '(resize) ')
    if (newChildren) {
      return <InteractingIndicator {...props} icon="resize">{newChildren}</InteractingIndicator>
    }

    newChildren = rehypeChildren(props.children, '(click) ')
    if (newChildren) {
      return <InteractingIndicator {...props} icon="click">{newChildren}</InteractingIndicator>
    }

    newChildren = rehypeChildren(props.children, '(type) ')
    if (newChildren) {
      return <InteractingIndicator {...props} icon="type">{newChildren}</InteractingIndicator>
    }

    newChildren = rehypeChildren(props.children, '(wand) ')
    if (newChildren) {
      return <InteractingIndicator {...props} icon="wand">{newChildren}</InteractingIndicator>
    }

    return <p {...props} />
  },
  a: (props: any) => <Link {...props} indicate />,
  h2: (props: any) => <DocHeading tagName="h2" {...props} />,
  h3: (props: any) => <DocHeading tagName="h3" {...props} />,
  //     let newChildren

  //     newChildren = rehypeChildren(props.children, 'New ')
  //     if (newChildren) {
  //         return <DocH3 {...props}>
  //             <IconSparkles className='app-icon-primary stroke-width:1 my:-0.375rem mr:0.5rem w:1.5em h:1.5em' />
  //             New {newChildren}
  //         </DocH3>
  //     }

  //     newChildren = rehypeChildren(props.children, 'Deprecated ')
  //     if (newChildren) {
  //         return <DocH3 {...props}>
  //             <IconFileX className='app-icon-red stroke-width:1 my:-0.375rem mr:0.5rem w:1.5em h:1.5em' />
  //             Deprecated {newChildren}
  //         </DocH3>
  //     }

  //     return <DocH3 {...props} />
  // },
  pre: (props: any) => {
    const { children } = props
    const langAndParams = children.props.className.split(' ')[0].replace('language-', '')
    let newProps: any = { name: '', lang: '', dedent: 'block' }
    if (children.props.meta) {
      const searchParams = new URLSearchParams(children.props.meta)
      for (const [key, value] of searchParams.entries()) {
        try {
          newProps[key] = JSON.parse(value)
        } catch {
          newProps[key] = value
        }
      }
    }
    if (!newProps.lang) {
      newProps.lang = langAndParams
    }
    if (newProps.name === 'Terminal' && newProps.showControls !== false) {
      newProps.showControls = true
    }
    if (newProps.lang === 'bash' && newProps.action) {
      return <PMAction action={newProps.action}>{children.props.children}</PMAction>
    }
    return <Code {...newProps}>{children.props.children}</Code>
  },
  img: (props: any) => {

    return <Image {...props} />
  },
  // Fixed server component error
  Image: (props: any) => {

    return <Image {...props} />
  },
  table: (props: any) => {
    return (
      <figure className='doc-table'>
        <table {...props} />
      </figure>
    )
  },
  Demo: (props: any) => <Demo {...props} />,
  DemoPanel: (props: any) => <DemoPanel {...props} />,
  DemoP: (props: any) => <DemoP {...props} />,
  DemoLabel: (props: any) => <DemoLabel {...props} />,
  InteractingIndicator: (props: any) => <InteractingIndicator {...props} />,
  Warn: (props: any) => <Warn {...props} />,
  DocProp: (props: any) => <DocProp {...props} />,
  DocFn: (props: any) => <DocFn {...props} />,
  Resizable: (props: any) => <Resizable {...props} />,
  StepSection: (props: any) => <StepSection {...props} />,
  Step: (props: any) => <Step {...props} />,
  StepNum: (props: any) => <StepNum {...props} />,
  StepL: (props: any) => <StepL {...props} />,
  StepR: (props: any) => <StepR {...props} />,
  StepEnd: (props: any) => <StepEnd {...props} />,
  CodeTabs: (props: any) => <CodeTabs {...props} />,
  Code: (props: any) => <Code {...props} />,
  InlineCode: (props: any) => <InlineCode {...props} />,
  BrowserHeader: (props: any) => <BrowserHeader {...props} />,
  HelloWorld: (props: any) => <HelloWorld {...props} />,
  ImageCallToPreview: (props: any) => <ImageCallToPreview {...props} />,
  InlineGood: (props: any) => <InlineGood {...props} />,
  InlineBad: (props: any) => <InlineBad {...props} />,
  InlineWarn: (props: any) => <InlineWarn {...props} />,
  ArticleTOC: (props: any) => <ArticleTOC {...props} />,
  IFrame: (props: any) => <IFrame {...props} />,
  ResizeZone: (props: any) => <ResizeZone {...props} />,
  DocBadge: (props: any) => <DocBadge {...props} />,
  Dropped: (props: any) => <Dropped {...props} />,
}

// This file is required to use MDX in `app` directory.
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...mdxComponents,
    ...components,
  }
}
