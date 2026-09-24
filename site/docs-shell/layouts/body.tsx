import clsx from 'clsx'
import CodeTabsBootstrap from '../components/CodeTabsBootstrap'

export default function Body({ children, className }: {
  children: React.ReactNode,
  className?: string
} & React.HTMLAttributes<HTMLBodyElement>) {
  return (
    <body className={clsx(
      className,
      'bg:slate-50/.2_:is(::selection)',
      'text:body'
    )}>
      <CodeTabsBootstrap />
      {children}
    </body>
  )
}
