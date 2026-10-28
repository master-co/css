import { IconChevronDown } from '@tabler/icons-react'
import ThemeSelect from '~/site/docs-shell/components/ThemeSelect'
import ThemeIcon from '~/site/docs-shell/components/ThemeIcon'
import Translate from '~/site/docs-shell/components/Translate'

export default function AppearanceControl({ label = 'Appearance' }: { label?: string }) {
  return <div className="ds-appearance"><Translate>{label}</Translate><span>
    <ThemeSelect aria-label={label} />
    <ThemeIcon width={18} height={18} strokeWidth={1.5} aria-hidden="true" />
    <IconChevronDown size={12} aria-hidden="true" />
  </span></div>
}
