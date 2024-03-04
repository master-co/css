import clsx from 'clsx'
import ThemeIcon from './ThemeIcon'
import ThemeSelect from './ThemeSelect'

export default function ThemeButton({ className }: any) {
    return (
        <button className={clsx(className, 'rel')} aria-label="theme switch">
            <ThemeIcon width="22" height="22" strokeWidth="1.2" />
            <ThemeSelect />
        </button>
    )
}