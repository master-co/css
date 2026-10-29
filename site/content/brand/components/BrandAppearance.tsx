import { IconChevronDown } from '@tabler/icons-react'
import ThemeSelect from '~/site/docs-shell/components/ThemeSelect'
import ThemeIcon from '~/site/docs-shell/components/ThemeIcon'
import Translate from '~/site/docs-shell/components/Translate'
import { useId } from 'react'

export default function BrandAppearance() {
  const id = useId()
  return <label className="brand-appearance" htmlFor={id}><ThemeIcon width={16} height={16} strokeWidth={1.5} aria-hidden="true" /><span><Translate>Appearance</Translate></span><IconChevronDown size={13} aria-hidden="true" /><ThemeSelect id={id} aria-label="Brand appearance" /></label>
}
