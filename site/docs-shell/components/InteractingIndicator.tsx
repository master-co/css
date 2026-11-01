import { IconHandClick, IconHandMove, IconForms, IconWand, IconResize, IconTestPipe } from '@tabler/icons-react'

const icons = { wand: IconWand, hover: IconHandMove, click: IconHandClick, type: IconForms, observe: IconTestPipe, resize: IconResize, test: IconTestPipe }

/** How to use the example that follows: a muted line led by its gesture. */
export default function InteractingIndicator({ children, icon }: { children: React.ReactNode; icon: keyof typeof icons }) {
  const Icon = icons[icon]
  return <p className="ui-hint"><Icon aria-hidden="true" />{children}</p>
}
